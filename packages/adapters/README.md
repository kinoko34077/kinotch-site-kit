# M1 POC adapters — implementation not yet accepted

These browser/runtime adapter prototypes are owned by [#8](https://github.com/kinoko34077/kinotch-site-kit/issues/8) and depend only on [pure Core #4](https://github.com/kinoko34077/kinotch-site-kit/issues/4).

- `createVanillaNavigationAdapter({currentRouteId})`: accepts a dedicated host element, renders safe text-based route links and a breadcrumb with site-root-prefixed URLs. It owns only a single child container; `dispose` removes that container, not the parent or sibling app DOM.
- `createReactStateAdapter(setState)`: has **no React runtime dependency** and only calls the host-provided callback; the host owns all React rendering and its `useEffect` cleanup.

Both are exercised by the existing M0 Pages fixtures via one shared SiteDefinition in `spikes/m0/src/site-contract.js`. The fixture integration is not a full SSR/hydration or static-CDN adapter acceptance, and does not imply release. Remaining M0 physical device, IME and licensing gates stay open.
