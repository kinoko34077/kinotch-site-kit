import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSiteDefinition, createSiteController,
  routeUrl, navigation, breadcrumbs, featureEnabled
} from '../index.mjs';

const input = () => ({
  id: 'demo-site', name: ' Demo site ', basePath: '/kinotch-site-kit/',
  layout: 'content', theme: 'system',
  routes: [
    { id: 'home', path: '/', title: 'ホーム' },
    { id: 'help', path: '/help', title: 'ヘルプ', parent: 'home' },
    { id: 'private-demo', path: '/internal', title: '内部', parent: 'help', nav: false }
  ],
  features: { search: false, theme: true }
});

test('v1 defaults, normalization, immutability and source provenance', () => {
  const d = createSiteDefinition({ id: 'a-site', name: ' Site ' });
  assert.equal(d.schemaVersion, 1);
  assert.equal(d.name, 'Site');
  assert.equal(d.layout, 'content');
  assert.equal(d.theme, 'system');
  assert.equal(d.basePath, '/');
  assert.equal(d.provenance.layout, 'default');
  assert.ok(Object.isFrozen(d) && Object.isFrozen(d.routes) && Object.isFrozen(d.provenance));
  assert.throws(() => { d.features.any = true; }, TypeError);
});

test('layer precedence and provenance never let preference override layout/features/routes', () => {
  const d = createSiteDefinition(input(), {
    preset: { layout: 'custom', theme: 'dark', features: { search: true, map: true } },
    routeOverride: { layout: 'immersive', theme: 'light' },
    preference: { theme: 'dark' }
  });
  assert.equal(d.layout, 'immersive');
  assert.equal(d.theme, 'dark');
  assert.equal(d.provenance.layout, 'route');
  assert.equal(d.provenance.theme, 'preference');
  assert.equal(d.provenance.features, 'site');
  assert.equal(d.features.search, false);
  assert.equal(d.features.map, true);
  assert.ok(featureEnabled(d, 'map') && !featureEnabled(d, 'search'));
  assert.equal(d.routes[0].id, 'home');
  assert.throws(() => createSiteDefinition(input(), { preference: { layout: 'immersive' } }), /forbidden field/);
  assert.throws(() => createSiteDefinition(input(), { routeOverride: { basePath: '/other/' } }), /forbidden field/);
  assert.throws(() => createSiteDefinition(input(), { preference: { features: { private: true } } }), /forbidden field/);
});

test('URL paths, nav visibility and parent-chain breadcrumbs honor GitHub Pages base', () => {
  const d = createSiteDefinition(input());
  assert.equal(routeUrl(d, 'home'), '/kinotch-site-kit/');
  assert.equal(routeUrl(d, 'help'), '/kinotch-site-kit/help');
  assert.deepEqual(breadcrumbs(d, 'private-demo').map(x => x.id), ['home', 'help', 'private-demo']);
  assert.deepEqual(navigation(d).map(x => x.id), ['home', 'help']);
  assert.throws(() => routeUrl(d, 'nope'), RangeError);
});

test('route inputs reject invalid parent, cycles, duplicate IDs and duplicate path', () => {
  for (const routes of [
    [{ id: 'home', path: '/', title: 'Home', parent: 'unknown' }],
    [{ id: 'x', path: '/x', title: 'X', parent: 'y' }, { id: 'y', path: '/y', title: 'Y', parent: 'x' }],
    [{ id: 'x', path: '/', title: 'X' }, { id: 'x', path: '/other', title: 'Y' }],
    [{ id: 'x', path: '/', title: 'X' }, { id: 'y', path: '/', title: 'Y' }],
    [{ id: 'home', path: '/hi', title: 'Hi', nav: 1 }]
  ]) {
    assert.throws(() => createSiteDefinition({ id: 'test', name: 'Test', routes }), /route|parent|duplicate/i);
  }
});

test('unsafe config, paths and feature names fail validation rather than silently alter access policy', () => {
  const cases = [
    { id: 'demo', name: 'Name', accessControl: false },
    { id: 'demo', name: 'Name', basePath: '//evil/' },
    { id: 'demo', name: 'Name', basePath: '/../private/' },
    { id: 'demo', name: 'Name', basePath: '/%2e%2e/admin/' },
    { id: 'demo', name: 'Name', basePath: '/a?b' },
    { id: 'demo', name: 'Name', features: { '__proto__': true, 'with space': true } },
    { id: 'demo', name: 'Name', layout: 'admin' },
    { id: 'demo', name: 'Name', theme: 'secret' },
    { id: 'demo', name: 'Name', routes: [{ id: 'no', path: 'javascript:alert(1)', title: 'Bad' }] }
  ];
  for (const sample of cases) assert.throws(() => createSiteDefinition(sample), /unknown|path|id|feature|unsupported|invalid|route/i);
  assert.throws(() => createSiteDefinition(Object.create(null)), /plain object/);
});

test('controller lifecycle: idempotent mount/unmount/dispose and subscription cleanup', () => {
  const events = [];
  const counts = { mounts: 0, updates: 0, disposes: 0 };
  const host = {};
  const adapter = {
    mount(h, d) {
      assert.equal(h, host); assert.equal(d.id, 'demo-site');
      counts.mounts += 1;
      return {
        update(next) { counts.updates += 1; events.push(next.theme); },
        dispose() { counts.disposes += 1; }
      };
    }
  };
  const controller = createSiteController(input());
  let published = 0;
  const off = controller.subscribe(() => published++);
  controller.mount(host, adapter).mount(host, adapter);
  assert.equal(counts.mounts, 1);
  assert.ok(controller.isMounted);
  controller.update({ ...input(), theme: 'light' });
  assert.equal(controller.definition.theme, 'light');
  assert.equal(counts.updates, 1);
  assert.deepEqual(events, ['light']);
  assert.equal(published, 1);
  off();
  controller.update({ ...input(), theme: 'dark' });
  assert.equal(published, 1);
  controller.unmount().unmount();
  assert.equal(counts.disposes, 1);
  controller.mount(host, adapter);
  assert.equal(counts.mounts, 2);
  controller.dispose();
  controller.dispose();
  assert.equal(counts.disposes, 2);
  assert.ok(controller.isDisposed);
  assert.throws(() => controller.mount(host, adapter), /disposed/);
  assert.throws(() => controller.update(input()), /disposed/);
});

test('invalid update is atomic: keep last-known-good definition and skip host update', () => {
  let updates = 0;
  const host = {};
  const adapter = { mount() { return { update() { updates += 1; }, dispose() {} }; } };
  const controller = createSiteController(input()).mount(host, adapter);
  const previous = controller.definition;
  assert.throws(() => controller.update({ ...input(), theme: 'bluish' }), /unsupported/);
  assert.equal(controller.definition, previous);
  assert.equal(updates, 0);
  controller.dispose();
});

test('host adapter failures do not commit invalid definition; other mounts disallowed', () => {
  const host = {}, other = {};
  let cleanup = 0;
  const adapter = { mount() { return {
    update(next) { if (next.theme === 'dark') throw new Error('host paint failed'); },
    dispose() { cleanup++; }
  }; } };
  const ctl = createSiteController(input()).mount(host, adapter);
  const prev = ctl.definition;
  assert.throws(() => ctl.mount(other, adapter), /already mounted/);
  assert.throws(() => ctl.update({ ...input(), theme: 'dark' }), /paint failed/);
  assert.equal(ctl.definition, prev);
  ctl.dispose();
  assert.equal(cleanup, 1);
});

test('bad adapter result gets bounded cleanup and does not mark mounted', () => {
  let cleanup = 0;
  const ctl = createSiteController(input());
  assert.throws(() => ctl.mount({}, { mount() { return { dispose() { cleanup++; } }; } }), /update/);
  assert.equal(cleanup, 1);
  assert.equal(ctl.isMounted, false);
  ctl.dispose();
});
