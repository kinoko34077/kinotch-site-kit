import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {collectBundledNotices} from '../scripts/bundled-notices.mjs';

async function setup({withLicense=true,license='MIT'}={}) {
  const root=await mkdtemp(join(tmpdir(),'site-kit-notices-'));
  const dir=join(root,'node_modules','example-lib');
  const out=join(root,'dist');
  await mkdir(dir,{recursive:true});await mkdir(out,{recursive:true});
  await writeFile(join(dir,'package.json'),JSON.stringify({name:'example-lib',version:'1.2.3',license}));
  await writeFile(join(dir,'index.js'),'export const example=true;\n');
  if(withLicense)await writeFile(join(dir,'LICENSE'),'Copyright 2026 Example\nPermission is granted.\n');
  const metafile={outputs:{'dist/bundle.js':{inputs:{'node_modules/example-lib/index.js':{},
    'src/own.js':{}}}}};
  return {root,out,metafile};
}
test('copies exact bundled license bytes and emits attributable output mapping',async()=>{
  const fixture=await setup();
  try{
    const r=await collectBundledNotices({metafile:fixture.metafile,
      workingDirectory:fixture.root,outputDirectory:fixture.out});
    const notice=await readFile(join(fixture.out,r.file),'utf8');
    assert.match(notice,/Copyright 2026 Example\nPermission is granted\./);
    assert.equal(r.packages.length,1);
    assert.equal(r.packages[0].licenseMetadata,'MIT');
    assert.deepEqual(r.packages[0].bundledOutputs,['bundle.js']);
    assert.match(r.packages[0].notices[0].sha256,/^[a-f0-9]{64}$/);
    assert.equal(r.bytes,Buffer.byteLength(notice));
  }finally{await rm(fixture.root,{recursive:true,force:true});}
});
test('missing legal text fails closed for a bundled dependency',async()=>{
  const fixture=await setup({withLicense:false});
  try{await assert.rejects(()=>collectBundledNotices({metafile:fixture.metafile,
    workingDirectory:fixture.root,outputDirectory:fixture.out}),/No root legal notice/);}
  finally{await rm(fixture.root,{recursive:true,force:true});}
});
test('dependency with no license metadata fails closed',async()=>{
  const fixture=await setup({license:''});
  try{await assert.rejects(()=>collectBundledNotices({metafile:fixture.metafile,
    workingDirectory:fixture.root,outputDirectory:fixture.out}),/Unknown license metadata/);}
  finally{await rm(fixture.root,{recursive:true,force:true});}
});
test('own-code-only bundles do not invent third-party attribution',async()=>{
  const fixture=await setup();
  try{
    const r=await collectBundledNotices({metafile:{outputs:{'dist/own.js':{inputs:{'src/own.js':{}}}}},
      workingDirectory:fixture.root,outputDirectory:fixture.out});
    assert.equal(r.packages.length,0);
    assert.match(await readFile(join(fixture.out,r.file),'utf8'),/Scope: only npm package sources/);
  }finally{await rm(fixture.root,{recursive:true,force:true});}
});

test('finds a peer bundled from a sibling features/node_modules directory',async()=>{
  const fixture=await setup();
  try {
    const runtime=join(fixture.root,'packages','runtime');
    const source=join(fixture.root,'packages','features','node_modules','example-lib');
    await mkdir(runtime,{recursive:true});await mkdir(source,{recursive:true});
    await writeFile(join(source,'package.json'),JSON.stringify({name:'example-lib',version:'1.2.3',license:'MIT'}));
    await writeFile(join(source,'LICENSE'),'MIT attribution from features scope\n');
    const r=await collectBundledNotices({
      metafile:{outputs:{'dist/bundle.js':{inputs:{
        '../features/node_modules/example-lib/index.js':{}
      }}}},
      workingDirectory:runtime,outputDirectory:fixture.out
    });
    assert.deepEqual(r.packages.map(x=>x.name),['example-lib']);
    assert.match(await readFile(join(fixture.out,r.file),'utf8'),/features scope/);
  }finally{await rm(fixture.root,{recursive:true,force:true});}
});
