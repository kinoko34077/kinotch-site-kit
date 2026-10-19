import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeatureCatalog, standardFeatureLoaders} from '../catalog.mjs';

test('registry creation does not evaluate any optional loader', async()=>{
  const calls=[];const c=createFeatureCatalog({loaders:{
    history:()=>{calls.push('history');return import('../../features/history.mjs');},
    seo:()=>{calls.push('seo');return import('../../features/seo.mjs');}
  }});
  assert.deepEqual(c.available(),['history','seo']);
  assert.deepEqual(calls,[]);
  assert.equal(c.loaded('history'),false);
  const mod=await c.load('history');
  assert.equal(typeof mod.createHistory,'function');
  assert.deepEqual(calls,['history']);
  assert.equal(c.loaded('history'),true);
  assert.equal(c.loaded('seo'),false);
});
test('concurrent requests coalesce and fulfilled loads never invoke again',async()=>{
  let invoked=0;let complete;
  const c=createFeatureCatalog({loaders:{history:()=>{invoked++;return new Promise(resolve=>{complete=resolve;});}}});
  const a=c.load('history'),b=c.load('history');
  assert.equal(a,b);
  await Promise.resolve();
  assert.equal(invoked,1);
  complete(Object.freeze({createHistory(){}}));
  const [left,right]=await Promise.all([a,b]);
  assert.equal(left,right);
  assert.equal(await c.load('history'),left);
  assert.equal(invoked,1);
});
test('failed feature loads can be retried without interfering with other modules',async()=>{
  let count=0;
  const c=createFeatureCatalog({loaders:{
    flaky:()=>{count++;if(count===1)throw Error('transient');return {ready:true};},
    safe:()=>({ok:true})
  }});
  await assert.rejects(c.load('flaky'),/transient/);
  assert.equal(c.loaded('flaky'),false);
  assert.equal((await c.load('safe')).ok,true);
  assert.equal((await c.load('flaky')).ready,true);
  assert.equal(count,2);
});
test('unknown IDs fail atomically before any loader work',async()=>{
  let calls=0;
  const c=createFeatureCatalog({loaders:{known:()=>{calls++;return null;}}});
  assert.throws(()=>c.load('missing'),RangeError);
  assert.throws(()=>c.loadSelected(['known','missing']),RangeError);
  assert.equal(calls,0);
  await assert.rejects(c.load('known'), /must resolve to an ES module namespace/);
  assert.equal(calls,1);
});
test('selected modules retain caller ordering and ignore duplicated IDs',async()=>{
  const calls=[];const c=createFeatureCatalog({loaders:{
    first:()=>{calls.push('first');return {ok:true};},
    second:()=>{calls.push('second');return {ok:true};}
  }});
  const result=await c.loadSelected(['second','first','second']);
  assert.deepEqual(Object.keys(result),['second','first']);
  assert.deepEqual(calls,['second','first']);
});
test('standard manifest loads only selected library functionality',async()=>{
  const c=createFeatureCatalog();
  assert.deepEqual(c.available(),['actions','pages','search','seo','history','i18n']);
  const m=await c.loadSelected(['history']);
  assert.equal(typeof m.history.createHistory,'function');
  for(const feature of ['actions','pages','search','seo','i18n'])assert.equal(c.loaded(feature),false);
  assert.equal(c.loaded('history'),true);
});
