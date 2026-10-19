export type OperationPhase = 'idle'|'dirty'|'saving'|'saved'|'failed';
export interface SaveToken { readonly id: number; readonly revision: number; }
export interface OperationSnapshot {
  readonly revision:number;readonly savedRevision:number;readonly phase:OperationPhase;
  readonly dirty:boolean;readonly pending:boolean;readonly error:string|null;
}
export interface OperationTracker {
  snapshot():OperationSnapshot;
  markDirty():number;
  beginSave():SaveToken|null;
  acknowledgeSaved(token:SaveToken):OperationSnapshot;
  failSave(token:SaveToken,reason:string):OperationSnapshot;
  dispose():void;
}
export function createOperationTracker(options?:{onChange?:(snapshot:OperationSnapshot)=>void}):OperationTracker;
