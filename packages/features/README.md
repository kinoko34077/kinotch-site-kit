# Composable Site Kit features (experimental)

- `actions.mjs` — Kit-owned action names, user rebind/unbind/reset, scope/collision checks, editable fields/IME guards, optional injected settings storage, mouse/touch `invoke()` parity and event cleanup. Browser/system keys are not overridden. More OS keyboard and physical IME matrix remains for #6.
- `pages.mjs` — opt-in Help/About/Contact/404/Privacy/Terms/Cookies **plain-text** model, no `innerHTML` rendering or generated legal assertions. Legal pages remain unavailable until site-owned text exists; a returned legal notice **does not mean the terms are reviewed or compliant**. Full route/SEO/i18n/search support remains #7.
- Both modules use no browser frameworks or services and can be combined with `packages/core` via an explicit host adapter. No auto analytics/cookies/network calls; settings are stored only if the host supplies storage.

Native tests: `node --test packages/features/tests/*.test.mjs`

**Not yet a released library, approved license bundle, or consumer rollout.** Tests and Pages demos may validate a bounded slice; core M0 physical device, full keyboard layout, bundle/SSR and old Safari acceptance remain open.
