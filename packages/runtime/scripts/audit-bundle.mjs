// Repeatable, development-only production ESM size audit (#32). No publication.
// "Optional" means not in catalog's eager initial ESM graph. A dynamic chunk may
// still be requested by the host later. Do not equate source size with field INP.
import {build} from 'esbuild';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,basename,relative} from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const catalog=resolve(root,'catalog.mjs');
const artifact=resolve(root,'artifacts');
const directory=await mkdtemp(join(tmpdir(),'site-kit-opt-'));
try{
  const result=await build({
    entryPoints:[catalog],
    bundle:true,format:'esm',platform:'browser',target:['es2022'],
    minify:true,splitting:true,treeShaking:true,metafile:true,
    outdir:directory,logLevel:'warning',
    entryNames:'entry-[name]-[hash]',chunkNames:'chunks/[name]-[hash]',
    legalComments:'none'
  });
  const entries=Object.entries(result.metafile.outputs);
  const entry=entries.find(([name,info])=>!!info.entryPoint &&
    (info.entryPoint.replaceAll('\\','/').endsWith('/catalog.mjs') || info.entryPoint==='catalog.mjs'));
  if(!entry)throw new Error('Missing catalog entry in esbuild metafile');
  const [entryPath,entryMeta]=entry;
  const lazy=entryMeta.imports.filter(x=>x.kind==='dynamic-import');
  if(lazy.length!==5)throw new Error('Expected exactly five independently lazy optional modules, got '+lazy.length);
  if(entryMeta.imports.some(x=>x.kind!=='dynamic-import')){
    // Native runtime entry has no static feature imports. Separate static shared helper
    // files would require explicit performance review and a budget adjustment.
    throw new Error('Catalog startup imports static chunks unexpectedly');
  }
  if(Object.keys(entryMeta.inputs).some(name=>name.includes('/features/'))){
    throw new Error('A feature module leaked into the initial entry chunk');
  }
  const records=[];
  for(const [path,info] of entries){
    const actualPath=resolve(path);
    const bytes=await readFile(actualPath);
    const gz=gzipSync(bytes,{level:9}).length;
    const br=brotliCompressSync(bytes).length;
    records.push({file:basename(path),relativePath:relative(directory,actualPath),raw:bytes.length,gzip:gz,brotli:br,
      entry:!!info.entryPoint, imports:info.imports.filter(x=>!x.external).length,
      modules:Object.keys(info.inputs).length});
  }
  const initial=records.find(x=>x.relativePath===relative(directory,resolve(entryPath)));
  if(!initial)throw new Error('Entry footprint missing');
  // Initial *budget*, not field metric. Revisit only with measured baseline evidence.
  if(initial.gzip>3000)throw new Error('Initial feature catalog exceeded 3 kB gzip budget: '+initial.gzip);
  for(const item of records)if(item.gzip>20000)throw new Error('Oversized optional chunk (>20 kB gzip): '+item.relativePath);
  const report={kind:'experimental-size-gate-not-user-performance-claim',esbuild:'0.28.2',
    generatedBy:'packages/runtime/scripts/audit-bundle.mjs',
    entryGzip:initial.gzip,entryBrotli:initial.brotli,initialModules:Object.keys(entryMeta.inputs),
    lazyChunkCount:lazy.length,outputs:records,
    notes:['All five features live behind ESM dynamic import; none is imported at catalog initialization.',
    'Bundled chunk sizes are not a substitute for real mobile load/input/JS heap measurements.',
    'No notice/license/legal validation or released package is implied.']};
  await mkdir(artifact,{recursive:true});
  await writeFile(join(artifact,'bundle-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('SITE_KIT_BUNDLE_AUDIT',JSON.stringify({entryGzip:report.entryGzip,
    entryBrotli:report.entryBrotli,lazyChunks:report.lazyChunkCount,
    totalGzip:records.reduce((sum,x)=>sum+x.gzip,0),files:records.length}));
}finally{
  await rm(directory,{recursive:true,force:true});
}
