// Experimental, pure ESM Site Kit core — vendor/framework/DOM independent.
// Owner: kinotch-site-kit #4. Do not treat v0.0.0 as a published stable API.
const LAYOUTS = new Set(['content', 'application', 'immersive', 'custom']);
const THEMES = new Set(['system', 'light', 'dark']);
const ID = /^[a-z][a-z0-9_-]*$/;
const ALLOWED_SITE = new Set(['id', 'name', 'basePath', 'layout', 'theme', 'routes', 'features']);
const ALLOWED_PRESET = new Set(['layout', 'theme', 'features']);
const ALLOWED_ROUTE = new Set(['layout', 'theme']);
const ALLOWED_PREF = new Set(['theme']);
const ALLOWED_ROUTE_DEF = new Set(['id', 'path', 'title', 'parent', 'nav']);
const OWN = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function assertPlain(value, context) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(context + ' must be a plain object');
  }
  return value;
}
function assertKeys(value, allowed, context) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(context + ': unknown/forbidden field "' + key + '"');
  }
}
function label(value, name) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(name + ' must be nonempty text');
  return value.trim();
}
function stableId(value, context) {
  if (typeof value !== 'string' || !ID.test(value) ||
    value === '__proto__' || value === 'constructor' || value === 'prototype') {
    throw new TypeError(context + ' must be a stable lowercase id');
  }
  return value;
}
function enumValue(value, allowed, name) {
  if (!allowed.has(value)) throw new TypeError(name + ' unsupported value');
  return value;
}
function normalizePath(path, name, trailing) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\\') ||
    path.includes('?') || path.includes('#') || path.includes('//') ||
    /[\u0000-\u001f\u007f]/.test(path) ||
    path.split('/').some(x => x === '.' || x === '..' || /%2f|%5c|%2e/i.test(x))) {
    throw new TypeError(name + ' must be an unambiguous root-relative path');
  }
  if (/%(?![0-9a-fA-F]{2})/.test(path)) throw new TypeError(name + ': invalid percent-encoding');
  if (trailing) return path === '/' ? '/' : path.replace(/\/+$/, '') + '/';
  return path === '/' ? '/' : path.replace(/\/+$/, '');
}
function freezeDeep(o) {
  if (!o || typeof o !== 'object' || Object.isFrozen(o)) return o;
  for (const key of Object.keys(o)) freezeDeep(o[key]);
  return Object.freeze(o);
}
function routesOf(input) {
  if (input === undefined) return [];
  if (!Array.isArray(input)) throw new TypeError('routes must be an array');
  const ids = new Set(), paths = new Set();
  const routes = input.map((raw, i) => {
    const r = assertPlain(raw, 'routes[' + i + ']');
    assertKeys(r, ALLOWED_ROUTE_DEF, 'routes[' + i + ']');
    const id = stableId(r.id, 'route id');
    const path = normalizePath(r.path, 'route path', false);
    const title = label(r.title, 'route title');
    if (ids.has(id) || paths.has(path)) throw new TypeError('duplicate route id/path: ' + id);
    ids.add(id); paths.add(path);
    if (r.nav !== undefined && typeof r.nav !== 'boolean') throw new TypeError('route nav must be boolean');
    const parent = r.parent === undefined ? null : stableId(r.parent, 'route parent');
    return { id, path, title, parent, nav: r.nav !== false };
  });
  const byId = new Map(routes.map(r => [r.id, r]));
  for (const route of routes) {
    const visited = new Set([route.id]);
    let parent = route.parent;
    while (parent !== null) {
      if (!byId.has(parent)) throw new TypeError('route parent not found: ' + parent);
      if (visited.has(parent)) throw new TypeError('cyclic route parent chain: ' + route.id);
      visited.add(parent);
      parent = byId.get(parent).parent;
    }
  }
  return routes;
}
function flags(value, context) {
  if (value === undefined) return {};
  assertPlain(value, context);
  const out = Object.create(null);
  for (const [name, enabled] of Object.entries(value)) {
    stableId(name, context + ' key');
    if (typeof enabled !== 'boolean') throw new TypeError(context + ': feature flag must be boolean');
    out[name] = enabled;
  }
  return Object.assign({}, out);
}
function layer(raw, allowed, context) {
  if (raw === undefined) return {};
  assertPlain(raw, context);
  assertKeys(raw, allowed, context);
  return raw;
}

/**
 * Pure config construction: defaults < preset < site < routeOverride < user preference.
 * Only theme/layout are page-overrideable; only theme is user-overrideable.
 * A preference never mutates site-owned identity, routes, feature flags or privileges.
 */
export function createSiteDefinition(input, options = {}) {
  const site = assertPlain(input, 'site');
  assertKeys(site, ALLOWED_SITE, 'site');
  const opt = layer(options, new Set(['preset', 'routeOverride', 'preference']), 'options');
  const preset = layer(opt.preset, ALLOWED_PRESET, 'preset');
  const route = layer(opt.routeOverride, ALLOWED_ROUTE, 'routeOverride');
  const pref = layer(opt.preference, ALLOWED_PREF, 'preference');
  const provenance = { layout: 'default', theme: 'default', basePath: 'default', features: 'default' };
  const result = {
    schemaVersion: 1,
    id: stableId(site.id, 'site id'),
    name: label(site.name, 'site name'),
    basePath: '/',
    layout: 'content',
    theme: 'system',
    routes: routesOf(site.routes),
    features: {},
    provenance
  };
  if (OWN(site, 'basePath')) {
    result.basePath = normalizePath(site.basePath, 'basePath', true);
    provenance.basePath = 'site';
  }
  for (const [name, obj] of [['preset', preset], ['site', site], ['route', route], ['preference', pref]]) {
    for (const key of ['layout', 'theme']) {
      if (OWN(obj, key)) {
        result[key] = enumValue(obj[key], key === 'layout' ? LAYOUTS : THEMES, key);
        provenance[key] = name;
      }
    }
  }
  for (const [name, obj] of [['preset', preset], ['site', site]]) {
    if (OWN(obj, 'features')) {
      result.features = { ...result.features, ...flags(obj.features, name + '.features') };
      provenance.features = name;
    }
  }
  return freezeDeep(result);
}

function byId(definition, id) {
  return definition.routes.find(route => route.id === id);
}
export function routeUrl(definition, id) {
  const route = byId(definition, id);
  if (!route) throw new RangeError('unknown route id: ' + id);
  // A route is site-root-relative; prepend the verified hosting path without doubling slashes.
  return definition.basePath + route.path.slice(1);
}
export function breadcrumbs(definition, id) {
  const target = byId(definition, id);
  if (!target) throw new RangeError('unknown route id: ' + id);
  const nodes = [];
  let current = target;
  while (current) {
    nodes.unshift({ id: current.id, title: current.title, url: routeUrl(definition, current.id) });
    current = current.parent ? byId(definition, current.parent) : null;
  }
  return nodes;
}
export function navigation(definition) {
  return definition.routes.filter(route => route.nav).map(route => ({
    id: route.id, title: route.title, url: routeUrl(definition, route.id)
  }));
}
export function featureEnabled(definition, id) {
  stableId(id, 'feature id');
  return definition.features[id] === true;
}

/**
 * Host adapter is separately owned (vanilla, React, etc).
 * mount() is idempotent on the same host+adapter, update() commits only after adapter succeeds;
 * unmount() allows remount, dispose() terminally closes controller and its subscriptions.
 */
export function createSiteController(input, options = {}) {
  let definition = createSiteDefinition(input, options);
  let active = null, disposed = false;
  const watchers = new Set();
  function open() { if (disposed) throw new Error('controller is disposed'); }
  const controller = {
    get definition() { return definition; },
    get isMounted() { return active !== null; },
    get isDisposed() { return disposed; },
    subscribe(callback) {
      open();
      if (typeof callback !== 'function') throw new TypeError('subscriber must be function');
      watchers.add(callback);
      return () => { watchers.delete(callback); };
    },
    mount(host, adapter) {
      open();
      if (host === null || host === undefined) throw new TypeError('host is required');
      if (!adapter || typeof adapter.mount !== 'function') throw new TypeError('adapter.mount is required');
      if (active) {
        if (active.host === host && active.adapter === adapter) return controller;
        throw new Error('controller already mounted on another host');
      }
      const binding = adapter.mount(host, definition);
      if (!binding || typeof binding.update !== 'function' || typeof binding.dispose !== 'function') {
        // If a faulty adapter returns an unusable handle, attempt bounded resource cleanup.
        binding?.dispose?.();
        throw new TypeError('adapter must return update() and dispose()');
      }
      active = { host, adapter, binding };
      return controller;
    },
    update(nextInput, nextOptions = {}) {
      open();
      const next = createSiteDefinition(nextInput, nextOptions);
      if (active) active.binding.update(next);
      definition = next;
      for (const callback of [...watchers]) callback(definition);
      return controller;
    },
    unmount() {
      if (!active) return controller;
      const previous = active;
      active = null;
      previous.binding.dispose();
      return controller;
    },
    dispose() {
      if (disposed) return;
      try { controller.unmount(); } finally { watchers.clear(); disposed = true; }
    }
  };
  return controller;
}
