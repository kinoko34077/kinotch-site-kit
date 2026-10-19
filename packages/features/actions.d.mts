/** Experimental vendor-agnostic action/keyboard contract. */
export interface ActionInvocation { id: string; shortcut: string | null; trigger: 'keyboard' | 'pointer' }
export interface ActionDefinition {
  id: string; title: string; scope?: string; defaultShortcut?: string | null;
  allowInEditable?: boolean; run(context: ActionInvocation): void;
}
export interface ActionInfo {
  id: string; title: string; scope: string;
  shortcut: string | null; defaultShortcut: string | null;
}
export interface ShortcutStore { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface ActionRegistry {
  list(): ActionInfo[];
  get(id: string): string | null;
  bind(id: string, shortcut: string): string;
  unbind(id: string): null;
  reset(id: string): string | null;
  resetAll(): void;
  setScopes(scopes: string[]): void;
  invoke(id: string): boolean;
  readonly storageStatus: string;
  dispose(): void;
}
export function normalizeShortcut(input: string): string;
export function createActionRegistry(options: {
  actions: ActionDefinition[];
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  storage?: ShortcutStore;
  storageKey?: string;
  onChange?(items: ActionInfo[]): void;
}): ActionRegistry;
