export interface HistorySnapshot {
  readonly index:number;
  readonly length:number;
  readonly canUndo:boolean;
  readonly canRedo:boolean;
}
export interface History<T> {
  readonly canUndo:boolean;
  readonly canRedo:boolean;
  readonly length:number;
  readonly index:number;
  readonly disposed:boolean;
  value(): T;
  snapshot(): HistorySnapshot;
  commit(value:T):T;
  undo():T|null;
  redo():T|null;
  reset(value:T):T;
  dispose():void;
}
export function createHistory<T>(initialState:T, options?:{
  limit?:number;
  clone?:(value:T)=>T;
  onChange?:(snapshot:HistorySnapshot)=>void;
}): History<T>;
