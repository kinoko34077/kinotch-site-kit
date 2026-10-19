// Experimental optional feature loader. Zero static imports of optional features.
// Keep this module usable in Node, Vanilla browser ESM and React hosts.
const TOKEN = /^[a-z][a-z0-9-]*$/;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

// Central manifest uses literal dynamic imports so bundlers emit individual chunks.
export const standardFeatureLoaders = Object.freeze({
  actions: () => import('../features/actions.mjs'),
  pages: () => import('../features/pages.mjs'),
  search: () => import('../features/search.mjs'),
  seo: () => import('../features/seo.mjs'),
  history: () => import('../features/history.mjs'),
  i18n: () => import('../features/i18n.mjs'),
  operation: () => import('../features/operation.mjs')
});

/**
 * A feature is AVAILABLE in the shared library but never loaded/initialized
 * merely because the catalog is created. Host selects specific capabilities.
 * Import caches are not equivalent to unloading executable modules.
 */
export function createFeatureCatalog({loaders = standardFeatureLoaders} = {}) {
  if (!loaders || typeof loaders !== 'object' || Array.isArray(loaders) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(loaders))) {
    throw new TypeError('loaders must be a plain lookup');
  }
  const registered = new Map();
  for (const [id, loader] of Object.entries(loaders)) {
    if (!TOKEN.test(id) || typeof loader !== 'function') throw new TypeError('invalid feature loader: '+id);
    registered.set(id, loader);
  }
  const inFlight = new Map(), fulfilled = new Map();
  function guard(id) {
    if (typeof id !== 'string' || !registered.has(id)) throw new RangeError('unknown feature');
  }
  function load(id) {
    guard(id);
    if (fulfilled.has(id)) return Promise.resolve(fulfilled.get(id));
    if (inFlight.has(id)) return inFlight.get(id);
    // Defer loader invocation: no side effects until the feature is requested.
    const promise = Promise.resolve()
      .then(() => registered.get(id)())
      .then(module => {
        if (!module || typeof module !== 'object') throw new TypeError('feature must resolve to an ES module namespace');
        fulfilled.set(id, module);
        inFlight.delete(id);
        return module;
      }, error => {
        // Import/load failures must remain retryable and must not poison other modules.
        inFlight.delete(id);
        throw error;
      });
    inFlight.set(id, promise);
    return promise;
  }
  function loadSelected(ids) {
    if (!Array.isArray(ids)) throw new TypeError('features must be an array');
    const selected = [...new Set(ids)];
    // Validate all IDs before invoking any loaders to avoid partial surprise work.
    for (const id of selected) guard(id);
    return Promise.all(selected.map(load)).then(modules =>
      Object.fromEntries(selected.map((id, index) => [id, modules[index]])));
  }
  return Object.freeze({
    available: () => [...registered.keys()],
    loaded: id => { guard(id); return fulfilled.has(id); },
    load, loadSelected
  });
}
