/**
 * Experimental self-hosted ESM distribution evidence, NOT npm publication or release.
 * Feature paths are immutable/content-hashed and imported only on consumer request.
 * Build uses pinned, local dev-only esbuild and bundled optional i18next dependency.
 */
import {build} from 'esbuild';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative,join} from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';

const here=resolve(fileURLToPath(new URL('../',import.meta.url)));
const root=resolve(here,'..');
const out=resolve(here,'artifacts','static-kit');
const entries={
  core:resolve(root,'core/index.mjs'),
  runtime:resolve(root,'runtime/catalog.mjs'),
  'vanilla-adapter':resolve(root,'adapters/vanilla.mjs'),
  'react-adapter':resolve(root,'adapters/react.mjs'),
  actions:resolve(root,'features/actions.mjs'),
  pages:resolve(root,'features/pages.mjs'),
  search:resolve(root,'features/search.mjs'),
  seo:resolve(root,'features/seo.mjs'),
  history:resolve(root,'features/history.mjs'),
  operation:resolve(root,'features/operation.mjs'),
  i18n:resolve(root,'features/i18n.mjs')
};
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
const result=await build({
  entryPoints:entries,
  absWorkingDir:here,
  bundle:true,format:'esm',platform:'browser',target:['es2022'],
  splitting:true,treeShaking:true,minify:true,metafile:true,
  legalComments:'eof',
  entryNames:'[name]-[hash]',chunkNames:'chunks/[name]-[hash]',
  outdir:out,logLevel:'warning',
  packages:'bundle'
});
const files=[],entryMap={};
for(const [path,meta] of Object.entries(result.metafile.outputs)){
  const full=resolve(here,path);
  const relativePath=relative(out,full).replaceAll('\\','/');
  if(relativePath.startsWith('../')||relativePath.startsWith('/')||relativePath.includes('..')){
    throw new Error('Output path escapes package directory');
  }
  if(meta.imports.some(imp=>imp.external)){
    throw new Error('Browser-static build has unresolved runtime bare import: '+relativePath);
  }
  const raw=await readFile(full);
  files.push({path:relativePath,sha256:createHash('sha256').update(raw).digest('hex'),
    bytes:raw.length,gzip:gzipSync(raw,{level:9}).length,
    brotli:brotliCompressSync(raw).length,
    moduleInputs:Object.keys(meta.inputs).length});
  if(meta.entryPoint){
    const original=resolve(here,meta.entryPoint);
    const key=Object.keys(entries).find(name=>entries[name]===original);
    if(!key)throw new Error('Unexpected entry source: '+original);
    entryMap[key]=relativePath;
  }
}
files.sort((a,b)=>a.path.localeCompare(b.path));
for(const key of Object.keys(entries))if(!entryMap[key])throw new Error('Missing static entry: '+key);
const entryMeta=Object.entries(result.metafile.outputs).find(([,meta])=>
  meta.entryPoint && resolve(here,meta.entryPoint)===entries.runtime)?.[1];
if(!entryMeta)throw new Error('Runtime metadata absent');
if(entryMeta.imports.filter(x=>x.kind==='dynamic-import').length!==7){
  throw new Error('Optional feature graph must have seven lazy imports');
}
if(Object.keys(entryMeta.inputs).some(x=>x.includes('/features/'))){
  throw new Error('Runtime startup accidentally includes optional feature implementations');
}
const runtimeInfo=files.find(f=>f.path===entryMap.runtime);
if(runtimeInfo.gzip>3000)throw new Error('Excess initial runtime JS after bundling');
const manifest={
  format:'kinotch-site-kit-static-proof.v1',
  version:'0.0.0-experimental',
  isRelease:false,
  notice:'UNRELEASED build artifact for CI and opt-in static-host verification only. No consumer deployment.',
  target:'ES2022 ESM self-hosted',
  loadPolicy:'Consumer explicitly imports the named content-hashed entry; optional entries do not execute automatically',
  entries:entryMap,
  files,
  note:'Hashes are content fingerprints, not audit of license notices, accessibility, field speed, or signed provenance'
};
await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const load=async key=>import(pathToFileURL(join(out,entryMap[key])).href);
const core=await load('core');
const definition=core.createSiteDefinition({id:'test',name:'Test',routes:[{id:'home',path:'/',title:'Home'}]});
if(definition.id!=='test')throw Error('Static core contract failed');
const hist=await load('history');
const undo=hist.createHistory(0);undo.commit(2);
if(undo.undo()!==0)throw Error('Static history undo failed');undo.dispose();
const op=(await load('operation')).createOperationTracker();
op.markDirty();const ticket=op.beginSave();
if(op.acknowledgeSaved(ticket).phase!=='saved')throw Error('Static operation status failed');
op.dispose();
const catalog=(await load('runtime')).createFeatureCatalog();
if(catalog.loaded('i18n'))throw Error('Optional i18n unexpectedly evaluated on catalog init');
const localization=await catalog.load('i18n');
if(typeof localization.createLocalization!=='function')throw Error('Built localized module missing');
const locale=await localization.createLocalization({resources:{ja:{greeting:'こんにちは'},en:{greeting:'Hello'}},language:'ja'});
if(locale.t('greeting')!=='こんにちは')throw Error('Static i18n bundle failed');
await locale.setLanguage('en');
if(locale.t('greeting')!=='Hello')throw Error('Static locale switch failed');
locale.dispose();
console.log('SITE_KIT_STATIC_DISTRIBUTION',JSON.stringify({
  entries:Object.keys(entryMap).length,
  files:files.length,
  runtimeGzip:runtimeInfo.gzip,
  combinedGzip:files.reduce((n,x)=>n+x.gzip,0),
  coreGzip:files.find(f=>f.path===entryMap.core).gzip,
  manifest:'packages/runtime/artifacts/static-kit/manifest.json',
  smoke:'core/history/operation/catalog/i18next PASS'
}));
