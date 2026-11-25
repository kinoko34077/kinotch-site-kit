// Opt-in cache boundary for explicitly public static assets. No SW registration,
// automatic requests, listeners or cache mutation at module/factory creation.
const TOKEN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
function token(value) {
  if (typeof value !== 'string' || !TOKEN.test(value)) throw new TypeError('invalid cache identity');
  return value;
}

export function createPublicAssetCache({scope, appId, version, assets, storage = globalThis.caches,
  fetcher = globalThis.fetch?.bind(globalThis)} = {}) {
  const root = new URL(scope);
  if (!['https:', 'http:'].includes(root.protocol) || root.username || root.password ||
      root.search || root.hash || !root.pathname.endsWith('/') ||
      /%(?:2f|5c|2e)/i.test(root.pathname)) throw new TypeError('invalid public asset scope');
  const prefix = 'site-kit-public:' + encodeURIComponent(root.href) + ':' + token(appId) + ':';
  const cacheName = prefix + token(version);
  if (!Array.isArray(assets) || !storage || typeof storage.open !== 'function' ||
      typeof storage.delete !== 'function' || typeof fetcher !== 'function') {
    throw new TypeError('invalid public asset cache dependencies');
  }
  const allowed = new Set(assets.map(value => {
    if (typeof value !== 'string' || !value) throw new TypeError('invalid asset');
    const url = new URL(value, root);
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname) ||
        url.username || url.password || url.search || url.hash ||
        /%(?:2f|5c|2e)/i.test(url.pathname)) throw new TypeError('asset outside public scope');
    return url.href;
  }));

  function usable(response) {
    return response?.status === 200 && !response.redirected &&
      ['basic', 'default'].includes(response.type) &&
      !/(?:^|,)\s*(?:private|no-store|no-cache)\b/i.test(response.headers.get('cache-control') || '') &&
      // Compression negotiation does not vary the decoded public asset bytes.
      (!response.headers.get('vary') || /^accept-encoding$/i.test(response.headers.get('vary').trim()));
  }
  async function read(url) {
    try {
      const cached = await (await storage.open(cacheName)).match(url);
      return usable(cached) ? cached : undefined;
    } catch { return undefined; }
  }
  async function network(url) {
    // Public static bytes only: do not forward cookies, authorization, or redirects.
    const response = await fetcher(url, {credentials: 'omit', redirect: 'error', cache: 'no-store'});
    if (usable(response)) {
      try { await (await storage.open(cacheName)).put(url, response.clone()); }
      catch { /* Cache failure must not hide a usable network response. */ }
    }
    return response;
  }
  async function resolve(url, strategy) {
    if (strategy === 'cache-first') {
      const cached = await read(url);
      if (cached) return cached;
    }
    let fresh;
    try { fresh = await network(url); }
    catch (error) {
      const cached = await read(url);
      if (cached) return cached;
      throw error;
    }
    // Do not mask authoritative 4xx removals/denials with old content.
    if (fresh.status >= 500 || fresh.status === 408 || fresh.status === 429) {
      return (await read(url)) || fresh;
    }
    return fresh;
  }
  function handle(request, strategy = 'network-first') {
    if (request?.method !== 'GET' || !allowed.has(request.url) ||
        request.headers.has('authorization') || request.headers.has('range')) return null;
    if (strategy !== 'network-first' && strategy !== 'cache-first') throw new TypeError('invalid cache strategy');
    return resolve(request.url, strategy);
  }
  function removeVersion(previousVersion) {
    const name = prefix + token(previousVersion);
    if (name === cacheName) throw new RangeError('cannot remove active version');
    return storage.delete(name);
  }
  return Object.freeze({cacheName, handle, removeVersion});
}
