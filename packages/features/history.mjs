/**
 * Bounded, host-owned reversible state history. No app data, persistence,
 * network, or DOM is captured without the caller explicitly providing it.
 * Intended for user-reversible in-memory edits, never remote transactions.
 */
function cloneValue(value) {
  if (typeof structuredClone !== 'function') {
    throw new Error('structuredClone unavailable: supply an explicit clone() adapter');
  }
  return structuredClone(value);
}
export function createHistory(initialState, {limit=50, clone=cloneValue, onChange}={}) {
  if (!Number.isInteger(limit) || limit<2 || limit>500) throw new TypeError('history limit must be 2..500');
  if (typeof clone !== 'function') throw new TypeError('clone must be a function');
  if (onChange!==undefined && typeof onChange!=='function') throw new TypeError('onChange must be function');
  // Initial value validation and clone take place before any state mutation.
  let timeline=[clone(initialState)], current=0, disposed=false;
  function open(){if(disposed)throw new Error('history disposed');}
  function signal(){onChange?.(api.snapshot());}
  const api={
    get canUndo(){return !disposed&&current>0;},
    get canRedo(){return !disposed&&current<timeline.length-1;},
    get length(){return timeline.length;},
    get index(){return current;},
    get disposed(){return disposed;},
    value(){open(); return clone(timeline[current]);},
    snapshot(){open(); return Object.freeze({
      index:current,length:timeline.length,canUndo:current>0,canRedo:current<timeline.length-1
    });},
    commit(next){
      open();const copied=clone(next);
      // Commit cloned state atomically; undo branch truncation occurs only on success.
      const kept=timeline.slice(0,current+1);
      kept.push(copied);
      if(kept.length>limit)kept.splice(0,kept.length-limit);
      timeline=kept; current=kept.length-1;
      signal();return api.value();
    },
    undo(){
      open();if(current===0)return null;
      current--;signal();return api.value();
    },
    redo(){
      open();if(current>=timeline.length-1)return null;
      current++;signal();return api.value();
    },
    reset(next){
      open();const copied=clone(next);
      timeline=[copied];current=0;signal();return api.value();
    },
    dispose(){
      if(disposed)return;
      disposed=true;timeline.length=0;current=0;
    }
  };
  return Object.freeze(api);
}
