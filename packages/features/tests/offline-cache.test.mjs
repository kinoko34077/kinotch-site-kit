import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicAssetCache} from '../offline-cache.mjs';

const scope = 'https://example.test/app/';
const url = scope + 'index.html';
const request = (value = url, init) => new Request(value, init);
const response = (value, init) => new Response(value, init);
function fixture() {
  const caches = new Map(), calls = [], deleted = [];
  let failPut = false, failOpen = false, next = () => response('fresh');
  const storage = {
    async open(name) {
      if (failOpen) throw Error('storage unavailable');
      if (!caches.has(name)) caches.set(name, new Map());
      const entries = caches.get(name);
      return {
        async match(key) { return entries.get(key)?.clone(); },
        async put(key, value) {
          if (failPut) throw Error('quota');
          entries.set(key, value.clone());
        }
      };
    },
    async delete(name) { deleted.push(name); return caches.delete(name); }
  };
  const fetcher = async (key, options) => { calls.push([key, options]); return next(); };
  const options = {scope, appId: 'app', version: 'v2', assets: ['index.html'], storage, fetcher};
  const kit = createPublicAssetCache(options);
  return {kit, options, caches, calls, deleted,
    failPut: () => { failPut = true; }, failOpen: () => { failOpen = true; },
    next: value => { next = value; }};
}
async function seed(f, name, value) {
  const cache = await f.options.storage.open(name);
  await cache.put(url, response(value));
}
test('factory and rejected requests do not touch network or storage', () => {
  const f = fixture();
  assert.equal(f.caches.size, 0);
  for (const req of [
    request('https://example.test/other/index.html'), request(scope + 'private.json'),
    request(url + '?user=1'), request(url, {method:'POST'}),
    request(url, {headers:{Authorization:'Bearer synthetic'}}),
    request(url, {headers:{Range:'bytes=0-3'}})
  ]) assert.equal(f.kit.handle(req), null);
  assert.equal(f.calls.length, 0);
  assert.equal(f.caches.size, 0);
  for (const asset of ['../other/index.html', 'https://elsewhere.test/a', 'index.html?x=1', '%2fother']) {
    assert.throws(() => createPublicAssetCache({...f.options, assets:[asset]}), TypeError);
  }
  assert.throws(() => createPublicAssetCache({...f.options, scope:'https://example.test/app'}), TypeError);
});
test('own current cache only, including same URL in other app and old version', async () => {
  const f = fixture();
  const other = createPublicAssetCache({...f.options, appId:'other'});
  const old = createPublicAssetCache({...f.options, version:'v1'});
  await seed(f, other.cacheName, 'OTHER');
  await seed(f, old.cacheName, 'OLD');
  await seed(f, f.kit.cacheName, 'OWN');
  assert.equal(await (await f.kit.handle(request(), 'cache-first')).text(), 'OWN');
  assert.equal(f.calls.length, 0);
  assert.equal(await f.kit.removeVersion('v1'), true);
  assert.deepEqual(f.deleted, [old.cacheName]);
  assert.ok(f.caches.has(other.cacheName));
  assert.ok(f.caches.has(f.kit.cacheName));
  assert.throws(() => f.kit.removeVersion('v2'), RangeError);
});
test('HTTP 503 and network rejection retain last good public asset', async () => {
  const f = fixture();
  await seed(f, f.kit.cacheName, 'GOOD');
  f.next(() => response('unavailable', {status:503}));
  assert.equal(await (await f.kit.handle(request())).text(), 'GOOD');
  f.next(() => { throw Error('offline'); });
  assert.equal(await (await f.kit.handle(request())).text(), 'GOOD');
  assert.equal(await (await f.kit.handle(request(), 'cache-first')).text(), 'GOOD');
  f.next(() => response('removed', {status:404}));
  assert.equal((await f.kit.handle(request())).status, 404);
  f.next(() => response('forbidden', {status:403}));
  assert.equal((await f.kit.handle(request())).status, 403);
});
test('cache miss preserves HTTP failure or network rejection rather than fake success', async () => {
  const f = fixture();
  f.next(() => response('missing', {status:404}));
  assert.equal((await f.kit.handle(request())).status, 404);
  f.next(() => { throw Error('offline'); });
  await assert.rejects(f.kit.handle(request()), /offline/);
});
test('successful public response refreshes own cache and omits credentials/redirects', async () => {
  const f = fixture();
  await seed(f, f.kit.cacheName, 'OLD');
  f.next(() => response('fresh', {headers:{vary:'Accept-Encoding'}}));
  assert.equal(await (await f.kit.handle(request())).text(), 'fresh');
  assert.equal(await (await f.kit.handle(request(), 'cache-first')).text(), 'fresh');
  assert.deepEqual(f.calls, [[url, {credentials:'omit', redirect:'error', cache:'no-store'}]]);
});
test('unusable responses are not persisted, cache-write failure does not hide fresh bytes', async () => {
  const f = fixture();
  await seed(f, f.kit.cacheName, 'GOOD');
  for (const headers of [{'cache-control':'private'}, {'cache-control':'no-store'},
    {'cache-control':'no-cache'}, {vary:'Accept-Language'}]) {
    f.next(() => response('not cacheable', {headers}));
    assert.equal(await (await f.kit.handle(request())).text(), 'not cacheable');
    assert.equal(await (await f.kit.handle(request(), 'cache-first')).text(), 'GOOD');
  }
  f.next(() => response('new'));
  f.failPut();
  assert.equal(await (await f.kit.handle(request())).text(), 'new');
  assert.equal(await (await f.kit.handle(request(), 'cache-first')).text(), 'GOOD');
});
test('unavailable cache does not stop the normal network response', async () => {
  const f = fixture();
  f.failOpen();
  assert.equal(await (await f.kit.handle(request(), 'cache-first')).text(), 'fresh');
});
