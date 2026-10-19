import test from 'node:test';
import assert from 'node:assert/strict';
import {createOperationTracker} from '../operation.mjs';

test('save status never becomes successful until matching host acknowledgement',()=>{
  const events=[];const t=createOperationTracker({onChange:x=>events.push(x)});
  assert.deepEqual(t.snapshot(),{revision:0,savedRevision:0,phase:'idle',dirty:false,pending:false,error:null});
  assert.equal(t.beginSave(),null);
  t.markDirty();
  assert.equal(t.snapshot().phase,'dirty');
  const ticket=t.beginSave();
  assert.equal(t.snapshot().phase,'saving');
  assert.equal(t.snapshot().dirty,true);
  assert.throws(()=>t.beginSave(),/already pending/);
  const result=t.acknowledgeSaved(ticket);
  assert.equal(result.phase,'saved');
  assert.equal(result.dirty,false);
  assert.equal(t.beginSave(),null);
  assert.ok(events.every(x=>Object.isFrozen(x)));
});

test('editing during an in-progress save must remain dirty even after success',()=>{
  const t=createOperationTracker();
  t.markDirty();
  const first=t.beginSave();
  t.markDirty();
  assert.equal(t.snapshot().pending,true);
  const intermediate=t.acknowledgeSaved(first);
  assert.equal(intermediate.phase,'dirty');
  assert.equal(intermediate.revision,2);
  assert.equal(intermediate.savedRevision,1);
  const second=t.beginSave();
  assert.ok(second.id>first.id);
  assert.equal(t.acknowledgeSaved(second).phase,'saved');
});

test('failed save must have explicit error, support retry without pretending success',()=>{
  const t=createOperationTracker();
  t.markDirty();
  const first=t.beginSave();
  assert.throws(()=>t.failSave(first,''),TypeError);
  assert.equal(t.snapshot().phase,'saving');
  assert.throws(()=>t.acknowledgeSaved({id:first.id,revision:first.revision}),RangeError);
  const failed=t.failSave(first,'Network unavailable');
  assert.equal(failed.phase,'failed');
  assert.equal(failed.error,'Network unavailable');
  assert.equal(failed.dirty,true);
  assert.throws(()=>t.acknowledgeSaved(first),RangeError);
  const retry=t.beginSave();
  assert.equal(t.snapshot().error,null);
  assert.equal(t.acknowledgeSaved(retry).phase,'saved');
});

test('dispose and no-op invalid events cannot mutate the confirmed state',()=>{
  const t=createOperationTracker();
  assert.throws(()=>t.failSave({},'bad'),RangeError);
  t.markDirty();
  const ticket=t.beginSave();
  t.dispose();t.dispose();
  for(const fn of [()=>t.snapshot(),()=>t.markDirty(),()=>t.beginSave(),
    ()=>t.acknowledgeSaved(ticket),()=>t.failSave(ticket,'fail')])assert.throws(fn,/disposed/);
});
