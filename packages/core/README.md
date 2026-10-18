# Site Kit Core — early M1 contract (NOT RELEASED)

Owner: [Issue #4](https://github.com/kinoko34077/kinotch-site-kit/issues/4) and [adapter #8](https://github.com/kinoko34077/kinotch-site-kit/issues/8). Status: **Experimental API and machine tests only**. No registered package, cross-site deployment or approved vendor composition guaranteed. This M1 slice does not declare M0 product acceptance.

`node --test packages/core/tests/*.test.mjs`

The core exports `createSiteDefinition`, `routeUrl`, `breadcrumbs`, `navigation`, `featureEnabled` and `createSiteController` in native ESM without Web Awesome/React/DOM imports. Matching NodeNext ESM TypeScript declarations are in `index.d.mts`.

Minimal configuration:

```js
import { createSiteDefinition, routeUrl, breadcrumbs } from './packages/core/index.mjs';
const site = createSiteDefinition({
  id: 'sample', name: 'Demo',
  basePath: '/kinotch-site-kit/',
  layout: 'content',
  routes: [
    { id: 'home', path: '/', title: 'Home' },
    { id: 'help', path: '/help', title: 'Help', parent: 'home' }
  ],
  features: { search: false }
}, { preference: { theme: 'dark' } });
routeUrl(site, 'help'); // /kinotch-site-kit/help
breadcrumbs(site, 'help'); // Home > Help
```

Layers: library defaults < preset < site < routeOverride < preference. The user preference may override *theme only*, a route override may modify *theme/layout only*. Invalid fields are rejected, never silently interpreted as permissions, user profiles or auth policies. A host adapter owns all DOM/React updates. `mount(host,adapter)` is idempotent for its current host and adapter; `unmount` allows future remount; `dispose` closes controller permanently. Invalid config and a throwing adapter prevent committing a new definition.

**Current boundaries:** The action registry, SSR bridge, schema migrations, physical/browser/IME safety, full production permission semantics, metadata/locale/settings storage, and component layout remain separate incomplete work. Controller adapter implementations must themselves perform safe cleanup and should not partially mutate user UI before throwing; no transactionality of an external host can be guaranteed by this pure core. This is initial v0 API and must not be labeled M1 accepted until two real host architectures use it.
