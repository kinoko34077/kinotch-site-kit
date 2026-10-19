import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistory} from '../history.mjs';
test('undo/redo and redo-branch discard preserve caller-owned state',()=>{
  const initial={count:1,nested:{enabled:true}};
  const h=createHistory(initial);
  initial.nested.enabled=false;
  assert.equal(h.value().nested.enabled,true);
  h.commit({count:2,nested:{enabled:true}});
  h.commit({count:3,nested:{enabled:true}});
  assert.equal(h.undo().count,2);
  assert.equal(h.undo().count,1);
  assert.equal(h.undo(),null);
  assert.equal(h.redo().count,2);
  h.commit({count:7,nested:{enabled:false}});
  assert.equal(h.canRedo,false);
  assert.equal(h.value().count,7);
  const v=h.value();v.nested.enabled=true;
  assert.equal(h.value().nested.enabled,false);
  h.dispose();
});
test('bounded memory retains last limit entries; does not claim unlimited undo',()=>{
  const h=createHistory(0,{limit:3});
  for(let i=1;i<=8;i++)h.commit(i);
  assert.equal(h.length,3);
  assert.equal(h.value(),8);
  assert.equal(h.undo(),7);
  assert.equal(h.undo(),6);
  assert.equal(h.undo(),null);
});
test('invalid clone and failed state copy never invalidate prior commits',()=>{
  const h=createHistory({a:1});
  h.commit({a:2});
  assert.throws(()=>h.commit({a:()=>{}}),/could not be cloned|clone/i);
  assert.equal(h.value().a,2);
  assert.equal(h.length,2);
  const broken=createHistory(1,{clone:x=>{if(x===3)throw Error('reject');return x;}});
  assert.throws(()=>broken.reset(3),/reject/);
  assert.equal(broken.value(),1);
});
test('snapshot notifications, reset, dispose and empty continuation semantics',()=>{
  const notifications=[];
  const h=createHistory('a',{onChange:s=>notifications.push(s),limit:2});
  h.commit('b');h.commit('c');
  assert.equal(notifications.length,2);
  assert.deepEqual(Object.keys(h.snapshot()),['index','length','canUndo','canRedo']);
  assert.equal(h.reset('new'),'new');
  assert.equal(h.canUndo,false);
  assert.equal(h.length,1);
  h.dispose();h.dispose();
  assert.equal(h.disposed,true);
  assert.throws(()=>h.value(),/disposed/);
  assert.throws(()=>h.commit('x'),/disposed/);
});
test('invalid settings fail before snapshot is created',()=>{
  for(const limit of [0,1,501,1.5,'20'])assert.throws(()=>createHistory(0,{limit}),TypeError);
  assert.throws(()=>createHistory(0,{clone:false}),TypeError);
});
