/**
 * KiNoTch. Site Kit experimental shortcut/action service.
 * No DOM writes, React/OSS imports, telemetry or storage unless explicitly injected.
 * Scoped actions and user-rebind/collision guards. #6 owns acceptance.
 */
const ID = /^[a-z][a-z0-9_-]*(?::[a-z][a-z0-9_-]*)?$/;
const SAFE_KEY = /^[A-Z0-9]$/;
const MODS = ['Ctrl', 'Alt', 'Shift', 'Meta'];
const RESERVED = new Set(['Ctrl+L', 'Ctrl+R', 'Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+P', 'Ctrl+S', 'Ctrl+F',
  'Meta+L', 'Meta+R', 'Meta+T', 'Meta+W', 'Meta+N', 'Meta+P', 'Meta+S', 'Meta+F']);
const isPlain = value => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

export function normalizeShortcut(input) {
  if (typeof input !== 'string') throw new TypeError('shortcut must be text');
  const raw = input.split('+').map(p => p.trim());
  if (raw.length < 2 || raw.some(p => !p)) throw new TypeError('shortcut requires modifier and key');
  const key = raw.pop().toUpperCase();
  if (!SAFE_KEY.test(key)) throw new TypeError('shortcut must end in one letter or digit');
  const names = raw.map(part => ({ ctrl: 'Ctrl', control: 'Ctrl', alt: 'Alt',
    option: 'Alt', shift: 'Shift', meta: 'Meta', cmd: 'Meta', command: 'Meta' }[part.toLowerCase()]));
  if (names.some(n => !n) || new Set(names).size !== names.length || !names.some(x => x !== 'Shift')) {
    throw new TypeError('shortcut requires distinct allowed modifiers');
  }
  const canonical = [...MODS.filter(m => names.includes(m)), key].join('+');
  if (RESERVED.has(canonical) || (/^(?:Ctrl|Meta)\+/.test(canonical) &&
    !canonical.includes('Alt+') && !canonical.includes('Shift+'))) {
    throw new TypeError('shortcut is reserved or unsafe for browser/OS');
  }
  return canonical;
}
function eventShortcut(event) {
  const key = (event.key ?? '').toUpperCase();
  if (!SAFE_KEY.test(key)) return null;
  const modifiers = [...(event.ctrlKey ? ['Ctrl'] : []), ...(event.altKey ? ['Alt'] : []),
    ...(event.shiftKey ? ['Shift'] : []), ...(event.metaKey ? ['Meta'] : [])];
  if (!modifiers.some(m => m !== 'Shift')) return null;
  const combination = [...modifiers, key].join('+');
  try { return normalizeShortcut(combination); } catch { return null; }
}
function editable(event) {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
  return path.some(node => {
    if (!node || typeof node !== 'object') return false;
    if (node.isContentEditable) return true;
    const tag = node.tagName?.toUpperCase?.();
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
      (typeof node.getAttribute === 'function' && (node.getAttribute('role') === 'textbox' ||
        node.getAttribute('contenteditable') === 'true'));
  });
}
export function createActionRegistry({ actions, target, storage, storageKey = 'site-kit-shortcuts-v1', onChange } = {}) {
  if (!Array.isArray(actions) || !target || typeof target.addEventListener !== 'function' ||
      typeof target.removeEventListener !== 'function') throw new TypeError('actions array and event target are required');
  if (onChange !== undefined && typeof onChange !== 'function') throw new TypeError('onChange must be function');
  if (typeof storageKey !== 'string' || !/^[a-z0-9:_-]+$/i.test(storageKey)) throw new TypeError('unsafe storage key');
  const map = new Map(), assigned = new Map();
  let disposed = false, scopes = new Set(['global']), storageStatus = 'not-configured';
  for (const a of actions) {
    if (!isPlain(a) || typeof a.id !== 'string' || !ID.test(a.id) || typeof a.title !== 'string' ||
        !a.title.trim() || typeof a.run !== 'function') throw new TypeError('invalid action');
    if (map.has(a.id)) throw new TypeError('duplicate action id');
    const scope = a.scope ?? 'global';
    if (typeof scope !== 'string' || !ID.test(scope)) throw new TypeError('invalid scope');
    const shortcut = a.defaultShortcut == null ? null : normalizeShortcut(a.defaultShortcut);
    const desc = Object.freeze({ id: a.id, title: a.title, scope, defaultShortcut: shortcut,
      run: a.run, allowInEditable: a.allowInEditable === true });
    map.set(a.id, desc);
    assigned.set(a.id, shortcut);
  }
  function collides(id, combo) {
    if (!combo) return null;
    const self = map.get(id);
    for (const [other, current] of assigned) {
      if (other === id || current !== combo) continue;
      const rhs = map.get(other);
      if (rhs.scope === self.scope || rhs.scope === 'global' || self.scope === 'global') return other;
    }
    return null;
  }
  for (const [id, combo] of assigned) {
    const clash = collides(id, combo);
    if (clash) throw new TypeError('default shortcut conflict: ' + id + ' and ' + clash);
  }
  function open() { if (disposed) throw new Error('action registry disposed'); }
  function publish() { onChange?.(api.list()); }
  function save() {
    if (!storage) return;
    try {
      storage.setItem(storageKey, JSON.stringify({ version: 1, bindings: Object.fromEntries(assigned) }));
      storageStatus = 'saved';
    } catch { storageStatus = 'unavailable'; }
  }
  function assign(id, value, persist = true) {
    open();
    if (!map.has(id)) throw new RangeError('unknown action');
    const combo = value == null ? null : normalizeShortcut(value);
    const clash = collides(id, combo);
    if (clash) throw new RangeError('shortcut conflict with ' + clash);
    assigned.set(id, combo);
    if (persist) save();
    publish();
    return combo;
  }
  function handle(event) {
    if (disposed || event.defaultPrevented || event.isComposing || event.key === 'Process' ||
        event.repeat || (event.type && event.type !== 'keydown')) return;
    const combo = eventShortcut(event);
    if (!combo) return;
    const focusedEditable = editable(event);
    const matches = [];
    for (const [id, shortcut] of assigned) {
      const a = map.get(id);
      if (shortcut !== combo || (a.scope !== 'global' && !scopes.has(a.scope)) ||
          (focusedEditable && !a.allowInEditable)) continue;
      matches.push(a);
    }
    matches.sort((a, b) => (a.scope === 'global') - (b.scope === 'global'));
    const chosen = matches[0];
    if (!chosen) return;
    event.preventDefault?.();
    chosen.run({ id: chosen.id, shortcut: combo, trigger: 'keyboard' });
  }
  target.addEventListener('keydown', handle);
  const api = {
    list() { return [...map.values()].map(a => ({id:a.id,title:a.title,scope:a.scope,
      shortcut:assigned.get(a.id),defaultShortcut:a.defaultShortcut})); },
    get(id) { if (!map.has(id)) throw new RangeError('unknown action'); return assigned.get(id); },
    bind(id, combo) { return assign(id, combo); },
    unbind(id) { return assign(id, null); },
    reset(id) { open(); if (!map.has(id)) throw new RangeError('unknown action'); return assign(id, map.get(id).defaultShortcut); },
    resetAll() {
      open();
      for (const [id,a] of map) assigned.set(id,a.defaultShortcut);
      save(); publish();
    },
    setScopes(next) {
      open();
      if (!Array.isArray(next) || next.some(x => typeof x !== 'string' || !ID.test(x))) throw new TypeError('invalid scopes');
      scopes = new Set(['global', ...next]); publish();
    },
    invoke(id) {
      open();
      const a = map.get(id);
      if (!a) throw new RangeError('unknown action');
      if (a.scope !== 'global' && !scopes.has(a.scope)) return false;
      a.run({ id:a.id, shortcut:assigned.get(id), trigger:'pointer' });
      return true;
    },
    get storageStatus() { return storageStatus; },
    dispose() {
      if (disposed) return;
      disposed = true;
      target.removeEventListener('keydown', handle);
      map.clear(); assigned.clear(); scopes.clear();
    }
  };
  if (storage) {
    try {
      const data = JSON.parse(storage.getItem(storageKey) ?? 'null');
      if (data?.version === 1 && isPlain(data.bindings)) {
        for (const [id, combo] of Object.entries(data.bindings)) {
          if (!map.has(id) || !(combo === null || typeof combo === 'string')) continue;
          try { assign(id, combo, false); } catch { /* invalid/stale user settings ignored per action */ }
        }
      }
      storageStatus = 'loaded';
    } catch { storageStatus = 'unavailable'; }
  }
  return api;
}
