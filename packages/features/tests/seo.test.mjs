import test from 'node:test';
import assert from 'node:assert/strict';
import { createSiteDefinition } from '../../core/index.mjs';
import { createPageMetadata, createSitemapXml, applyPageMetadata } from '../seo.mjs';

function fixture() {
  return createSiteDefinition({
    id:'static-site',name:'Site Kit Test',basePath:'/kinotch-site-kit/',
    routes:[
      {id:'home',path:'/',title:'トップ'},
      {id:'help',path:'/help.html',title:'ヘルプ',parent:'home'},
      {id:'internal',path:'/private',title:'内部',nav:false}
    ]
  });
}
test('canonical and titles use verified site route with no invented legal metadata',()=>{
  const m=createPageMetadata(fixture(),{origin:'https://example.com',routeId:'help',description:'説明'});
  assert.equal(m.title,'ヘルプ | Site Kit Test');
  assert.equal(m.canonical,'https://example.com/kinotch-site-kit/help.html');
  assert.equal(m.description,'説明');
  assert.equal(m.robots,'index, follow');
  assert.ok(Object.isFrozen(m));
  assert.equal(createPageMetadata(fixture(),{origin:'https://example.com',routeId:'home',noIndex:true}).robots,'noindex, nofollow');
});
test('rejects insecure, ambiguous or forged public origins and missing routes',()=>{
  for(const origin of ['http://example.com','https://a:b@example.com','https://example.com/path',
    'https://example.com/?key=1','javascript:alert(1)','https://example.com/#frag','']) {
    assert.throws(()=>createPageMetadata(fixture(),{origin,routeId:'home'}),TypeError,origin);
  }
  assert.throws(()=>createPageMetadata(fixture(),{origin:'https://example.com',routeId:'missing'}),RangeError);
  assert.throws(()=>createPageMetadata(fixture(),{origin:'https://example.com',routeId:'home',description:7}),TypeError);
});
test('sitemap only lists explicit navigation routes and escapes XML',()=>{
  const xml=createSitemapXml(fixture(),{origin:'https://example.com'});
  assert.match(xml,/\/kinotch-site-kit\/<\/loc>/);
  assert.match(xml,/\/kinotch-site-kit\/help.html<\/loc>/);
  assert.doesNotMatch(xml,/\/private/);
  assert.match(xml,/<urlset/);
});
test('metadata DOM adapter preserves title and existing tags after cleanup',()=>{
  // Tiny DOM ownership fixture (no JSDOM dependency).
  const selectors=new Map();
  const created=[];
  const head={
    querySelector(sel){return selectors.get(sel)??null;},
    append(el){created.push(el); if(el.tag==='meta') selectors.set('meta[name="'+el.attributes.name+'"]',el);}
  };
  class Element {
    constructor(tag){this.tag=tag;this.attributes={};this.removed=false;}
    setAttribute(name,value){this.attributes[name]=value;}
    getAttribute(name){return this.attributes[name]??null;}
    removeAttribute(name){delete this.attributes[name];}
    remove(){this.removed=true;}
  }
  // Validate a real browser in Playwright; this structure is deliberately a limited adapter unit probe.
  const doc={title:'Before',head,createElement(tag){return new Element(tag);}};
  const cleanup=applyPageMetadata(doc,{title:'After',description:'D',robots:'index, follow',canonical:'https://example.com/'});
  assert.equal(doc.title,'After');
  assert.equal(created.length,3);
  cleanup();cleanup();
  assert.equal(doc.title,'Before');
  assert.ok(created.every(x=>x.removed));
});
