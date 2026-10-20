/**
 * Preserve literal legal/attribution texts from npm packages whose source is
 * actually included in the emitted JS graph. This is a technical proof, NOT
 * license compatibility clearance or Site Kit's own licensing decision.
 */
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join,relative,resolve,sep} from 'node:path';

const sourcePath = x => x.split('\\').join('/');
const digest = buffer => createHash('sha256').update(buffer).digest('hex');
const legalFile = name => /^(?:license|licence|copying|notice|third[-_. ]party)(?:[._ -]|$)/i.test(name);
const within = (root,path) => {
  const rel=relative(root,path);
  return rel!==''&&!rel.startsWith('..'+sep)&&rel!=='..'&&!rel.startsWith(sep);
};

async function nearestInstalledPackage(inputPath, workingDirectory) {
  const source=sourcePath(inputPath);
  if(!/(?:^|\/)node_modules\//.test(source))return null;
  let folder=dirname(resolve(workingDirectory,inputPath));
  // A feature module may resolve a peer from a sibling package's node_modules.
  // Restrict inspection to this repository, not just the runtime subdirectory.
  const boundary=resolve(workingDirectory,'../..');
  while(within(boundary,folder)){
    try {
      const data=JSON.parse(await readFile(join(folder,'package.json'),'utf8'));
      if(typeof data.name==='string'&&typeof data.version==='string') {
        return {root:folder,meta:data};
      }
    } catch(error) {
      if(error.code!=='ENOENT')throw error;
    }
    folder=dirname(folder);
  }
  throw new Error('Included dependency source has no readable package.json: '+source);
}

/**
 * Actual license text is read from installed files, never recreated or
 * inferred from SPDX metadata. Missing file/metadata fails the build.
 */
export async function collectBundledNotices({metafile,workingDirectory,outputDirectory}) {
  if(!metafile||!metafile.outputs||!workingDirectory||!outputDirectory){
    throw new TypeError('Build metafile and directories required');
  }
  const bundled=new Map();
  for(const [output,meta] of Object.entries(metafile.outputs)){
    const shipped=relative(outputDirectory,resolve(workingDirectory,output)).split(sep).join('/');
    for(const input of Object.keys(meta.inputs||{})){
      const pkg=await nearestInstalledPackage(input,workingDirectory);
      if(!pkg)continue;
      const entry=bundled.get(pkg.root)||{meta:pkg.meta,outputs:new Set()};
      entry.outputs.add(shipped);
      bundled.set(pkg.root,entry);
    }
  }
  const packages=[],parts=['KiNoTch. Site Kit — bundled third-party notices\n',
    'Scope: only npm package sources included in this experimental JS build.\n',
    'This evidence does not certify license compliance or cover separately shipped CSS/icons.\n'];
  for(const [directory,{meta,outputs}] of [...bundled.entries()].sort((a,b)=>
    a[1].meta.name.localeCompare(b[1].meta.name)||a[1].meta.version.localeCompare(b[1].meta.version))){
    if(typeof meta.license!=='string'||!meta.license.trim()){
      throw new Error('Unknown license metadata for bundled package: '+meta.name);
    }
    const listing=await readdir(directory,{withFileTypes:true});
    const legal=listing.filter(x=>x.isFile()&&legalFile(x.name))
      .map(x=>x.name).sort();
    if(!legal.length)throw new Error('No root legal notice file for bundled package: '+meta.name+'@'+meta.version);
    const notices=[];
    parts.push('\n=== '+meta.name+'@'+meta.version+' | metadata license: '+meta.license+' ===\n');
    for(const name of legal){
      const bytes=await readFile(join(directory,name));
      if(bytes.length===0||bytes.length>524288||bytes.includes(0)){
        throw new Error('Unreadable/empty/oversize legal notice file: '+meta.name+'/'+name);
      }
      const text=bytes.toString('utf8');
      if(Buffer.from(text,'utf8').length!==bytes.length)throw new Error('Non-UTF8 license file: '+name);
      notices.push({file:name,sha256:digest(bytes),bytes:bytes.length});
      parts.push('\n--- '+name+' ---\n'+text+(text.endsWith('\n')?'':'\n'));
    }
    packages.push({name:meta.name,version:meta.version,licenseMetadata:meta.license,
      bundledOutputs:[...outputs].sort(),notices});
  }
  const output=join(outputDirectory,'THIRD_PARTY_NOTICES.txt');
  const noticeBytes=Buffer.from(parts.join(''),'utf8');
  await writeFile(output,noticeBytes);
  return {packages,file:'THIRD_PARTY_NOTICES.txt',bytes:noticeBytes.length,
    sha256:digest(noticeBytes)};
}
