// No-framework local fixture server: same-origin static Site Kit bytes under /probe/.
// Only for CI/read-only tests. No deployment and no external network listener.
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join,relative,extname,sep} from 'node:path';
const folder=resolve(fileURLToPath(new URL('../artifacts/static-kit/',import.meta.url)));
const html=fileURLToPath(new URL('../fixtures/plain-site/index.html',import.meta.url));
const port=4183;
const types={'.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=createServer(async(req,res)=>{
  let file;
  try{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(pathname==='/probe/'||pathname==='/probe/index.html'){
      file=html;
    }else if(pathname.startsWith('/probe/kit/')){
      const part=decodeURIComponent(pathname.slice('/probe/kit/'.length));
      if(!part||part.split('/').some(s=>!s||s==='.'||s==='..')||!(/^[\w./-]+$/.test(part))){
        throw new Error('invalid asset path');
      }
      file=resolve(folder,part);
      const rel=relative(folder,file);
      if(rel.startsWith('..')||rel.startsWith(sep)||rel==='')throw new Error('outside artifact root');
    }else throw new Error('unknown route');
    const info=await stat(file);
    if(!info.isFile())throw new Error('not a file');
    res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff'});
    createReadStream(file).pipe(res);
  }catch{
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    res.end('Not found');
  }
});
server.listen(port,'127.0.0.1',()=>console.log('STATIC_SITE_FIXTURE_READY http://127.0.0.1:'+port+'/probe/'));
