# Composable Site Kit features (experimental)

- `actions.mjs` — Kit-owned action names, user rebind/unbind/reset, scope/collision checks, editable fields/IME guards, optional injected settings storage, mouse/touch `invoke()` parity and event cleanup. Browser/system keys are not overridden. More OS keyboard and physical IME matrix remains for #6.
- `pages.mjs` — opt-in Help/About/Contact/404/Privacy/Terms/Cookies **plain-text** model, no `innerHTML` rendering or generated legal assertions. Legal pages remain unavailable until site-owned text exists; a returned legal notice **does not mean the terms are reviewed or compliant**. Full route/SEO/i18n/search support remains #7.
- `seo.mjs` — route-aware canonical/title/description/robots metadata, sitemap XML generation from enabled route registry, optional reversible document-head adapter. Requires an explicit validated HTTPS origin; never invents site URLs or analytics.
- `search.mjs` — opt-in, offline-only small-site page search. NFKC/case-insensitive substring lookup, multiword intersection and safe text snippets. `searchIndexFromPages` indexes only enabled and owner-reviewed pages; does not index unapproved legal drafts. This is NOT Pagefind or complete site-wide static HTML indexing.
- `i18n.mjs` — **opt-in i18next 26.4.2** loader; explicit self-hosted locale dictionaries, isolated instance, serial language switching, Intl date/number formatting, language direction and cleanup. i18next isn't imported until `createLocalization()` is requested; no automatic network, locale detection, Locize, browser storage or global singleton.
- All modules use no browser frameworks or services and can be combined with `packages/core` via an explicit host adapter. No auto analytics/cookies/network calls; settings are stored only if the host supplies storage.

Native tests: `node --test packages/features/tests/*.test.mjs`

**Not yet a released library, approved license bundle, or consumer rollout.** Tests and Pages demos may validate a bounded slice; core M0 physical device, full keyboard layout, bundle/SSR and old Safari acceptance remain open.
