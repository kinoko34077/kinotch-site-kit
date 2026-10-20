/**
 * Read-only dependency provenance snapshot for Site Kit M0/M4.
 * Inventory installed metadata and file names, never scrape credentials,
 * upload source content, or treat package license fields as legal clearance.
 */
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('../../../',import.meta.url)));
const scopes=['packages/runtime','packages/features','spikes/m0'];
const records=[];
const already=new Set();
let absentRoots=0;
let unreadable=0;
async function children(path){
  try{return await readdir(path,{withFileTypes:true});}
  catch(error){
    if(error.code==='ENOENT')return null;
    throw error;
  }
}
const legalFile=name=>/^(license|licence|copying|notice|third[-_. ]party)(?:[._ -]|$)/i.test(name);
async function inspect(dir,source,depth){
  if(depth>12)throw new Error('Unexpected nested dependency depth');
  const key=dir;
  if(already.has(key))return;
  already.add(key);
  let meta;
  try{meta=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));}
  catch(error){if(error.code==='ENOENT'){unreadable++;return;}throw error;}
  if(typeof meta.name!=='string'||typeof meta.version!=='string')throw new Error('Invalid dependency package metadata under '+source);
  const files=await children(dir)||[];
  const notices=files.filter(x=>x.isFile()&&legalFile(x.name)).map(x=>x.name).sort();
  const license=typeof meta.license==='string'?meta.license:
    (meta.license&&typeof meta.license.type==='string'?meta.license.type:'UNKNOWN');
  records.push({
    source,package:meta.name,version:meta.version,license,
    noticeFiles:notices,noticePresent:notices.length>0,
    licenseMetadataPresent:license!=='UNKNOWN'
  });
  await packagesUnder(join(dir,'node_modules'),source,depth+1);
}
async function packagesUnder(modules,source,depth){
  const items=await children(modules);
  if(!items){if(depth===0)absentRoots++;return;}
  for(const item of items){
    if(!item.isDirectory()||item.name.startsWith('.'))continue;
    if(item.name.startsWith('@')){
      const scoped=await children(join(modules,item.name))||[];
      for(const part of scoped){
        if(part.isDirectory())await inspect(join(modules,item.name,part.name),source,depth);
      }
    }else await inspect(join(modules,item.name),source,depth);
  }
}
for(const scope of scopes)await packagesUnder(resolve(root,scope,'node_modules'),scope,0);
if(!records.length||absentRoots)throw new Error('Missing installed dependency corpus: '+absentRoots+' roots; '+records.length+' packages');
records.sort((a,b)=>a.package.localeCompare(b.package)||a.version.localeCompare(b.version)||a.source.localeCompare(b.source));
const unique=[...new Map(records.map(x=>[x.package+'@'+x.version,x])).values()];
const unresolved=unique.filter(x=>!x.licenseMetadataPresent||!x.noticePresent);
const report={
  schema:'site-kit-dependency-metadata-audit.v1',
  status:'evidence-only, not legal license clearance, NOTICE text/SBOM or vulnerability scan',
  observedFrom:'CI-installed package.json metadata and common license/NOTICE filename candidates',
  scope:scopes,installedCopies:records.length,distinctNameVersions:unique.length,
  unknownLicenseMetadata:unique.filter(x=>!x.licenseMetadataPresent).length,
  withoutNoticeFilename:unique.filter(x=>!x.noticePresent).length,
  absentRootCount:absentRoots,unreadablePackageDirectories:unreadable,
  unresolved:unresolved.map(x=>({package:x.package,version:x.version,license:x.license,noticeFiles:x.noticeFiles})),
  packages:records,
  limitations:[
    'A package.json license label does not establish compatibility or permissions.',
    'Notices can live in bundled subdirectories or dependencies, or require attribution even when metadata is present.',
    'npm install --no-package-lock does not prove reproducible transitive versions; pinning and actual NOTICE text audit remain open.',
    'This scan excludes non-installed optional platform packages and Vite-external/public remote resources.'
  ]
};
const dir=resolve(root,'packages/runtime/artifacts');
await mkdir(dir,{recursive:true});
await writeFile(join(dir,'dependency-license-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('SITE_KIT_LICENSE_METADATA_AUDIT',JSON.stringify({
  installedCopies:report.installedCopies,distinctNameVersions:report.distinctNameVersions,
  unknownLicenseMetadata:report.unknownLicenseMetadata,
  withoutNoticeFilename:report.withoutNoticeFilename,
  unresolved:report.unresolved.length
}));
