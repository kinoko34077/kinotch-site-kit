// Evidence-only static Vite output inventory: actual emitted gzip/Brotli/raw.
// This is *not* user network transfer, browser decode/CPU, field CWV or license approval.
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,extname,join} from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
const dist=resolve('dist');
const out=resolve('artifacts/m0-build-size.json');
async function visit(folder,found=[]){
  for(const entry of await readdir(folder,{withFileTypes:true})){
    const path=join(folder,entry.name);
    if(entry.isDirectory())await visit(path,found);
    else if(entry.isFile()&&['.html','.css','.js'].includes(extname(path)))found.push(path);
  }
  return found;
}
const paths=await visit(dist);
if(!paths.some(path=>path.endsWith('/index.html')) ||
   !paths.some(path=>path.endsWith('/react.html')))throw Error('Missing both browser hosts');
const files=[];
for(const path of paths){
  const bytes=await readFile(path);
  files.push({
    path:relative(dist,path).replaceAll('\\','/'),
    type:extname(path).slice(1),
    raw:bytes.length,
    gzip:gzipSync(bytes,{level:9}).length,
    brotli:brotliCompressSync(bytes).length
  });
}
files.sort((a,b)=>a.path.localeCompare(b.path));
const css=files.filter(f=>f.type==='css');
const sums=category=>({
  raw:category.reduce((n,f)=>n+f.raw,0),
  gzip:category.reduce((n,f)=>n+f.gzip,0),
  brotli:category.reduce((n,f)=>n+f.brotli,0)
});
const report={
  name:'site-kit-m0-static-build-asset-inventory',
  scope:'Emitted files, not actual per-route requested/cached bytes or field performance',
  files,
  total:sums(files),
  css:sums(css),
  cssFiles:css.length,
  baselinePriorFullWebAwesomeCss:{raw:115750,gzip:17450,source:'PR #35 CI #39232991527 (rounded from printed Vite values)'},
  caveats:['CSS comparison only, not full route transfer or render time',
    'Multi-page shared vendor JS is counted once in this emitted-asset report',
    'No external/network font resources included in static assets',
    'Check actual request events in separate Playwright tests']
};
if(!css.length)throw Error('Expected CSS output');
await mkdir('artifacts',{recursive:true});
await writeFile(out,JSON.stringify(report,null,2)+'\n');
console.log('M0_BUILD_SIZE_AUDIT',JSON.stringify({
  css:report.css,cssFiles:report.cssFiles,total:report.total,files:files.length
}));
// Budget is intentionally CSS-only in this isolated refactor.
// Avoid introducing a regression vs previous full Web Awesome CSS bundle.
if(report.css.gzip>17450){
  throw new Error('CSS gzip footprint exceeds previous published baseline: '+report.css.gzip);
}
