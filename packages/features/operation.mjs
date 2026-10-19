/**
 * Honest app-task status state (experimental, opt-in).
 * The host remains responsible for real persistence and irreversible actions.
 * Never claims "saved" without matching beginSave/acknowledgeSaved evidence.
 */
export function createOperationTracker({onChange}={}) {
  if(onChange!==undefined && typeof onChange!=='function')throw new TypeError('onChange must be function');
  let revision=0,savedRevision=0,phase='idle',pending=null,error=null;
  let sequence=0,disposed=false;
  function open(){if(disposed)throw new Error('operation tracker disposed');}
  function snapshot() {
    open();
    return Object.freeze({revision,savedRevision,phase,
      dirty:revision>savedRevision,pending:pending!==null,error});
  }
  function emit(){onChange?.(snapshot());}
  const api=Object.freeze({
    snapshot,
    markDirty(){
      open();revision++;
      error=null;
      // A save already in progress does not cover edits occurring after it started.
      if(phase!=='saving')phase='dirty';
      emit();return revision;
    },
    beginSave(){
      open();
      if(pending!==null)throw new Error('save already pending; serialize writes');
      if(revision===savedRevision)return null; // no unsaved changes
      const token=Object.freeze({id:++sequence,revision});
      pending=token;phase='saving';error=null;emit();return token;
    },
    acknowledgeSaved(token){
      open();
      if(!pending || token!==pending)throw new RangeError('invalid/stale save token');
      // Only a host-confirmed acknowledged revision can become saved.
      savedRevision=Math.max(savedRevision,token.revision);
      pending=null;error=null;
      phase=revision===savedRevision?'saved':'dirty';
      emit();return snapshot();
    },
    failSave(token,reason){
      open();
      if(!pending || token!==pending)throw new RangeError('invalid/stale save token');
      if(typeof reason!=='string' || !reason.trim())throw new TypeError('explicit error message required');
      error=reason.trim();
      pending=null;phase='failed';emit();return snapshot();
    },
    dispose(){disposed=true;pending=null;error=null;}
  });
  return api;
}
