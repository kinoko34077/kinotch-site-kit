# KiNoTch. Site Kit

Reusable and configurable Website/Application Shell + standard feature kit for KiNoTch.'s heterogeneous public websites. **M0 browser preview published; M1 experimental core and dual-host adapters implemented and tested.** Formal product acceptance, consumer migration and reusable package release are **not completed**.

## Public M0 verification pages

- [Vanilla JavaScript preview](https://kinoko34077.github.io/kinotch-site-kit/) — responsive navigation, theme, notifications, hotkey recording and input preservation.
- [React preview](https://kinoko34077.github.io/kinotch-site-kit/react.html) — React-owned state alongside Web Components.
- [Pages publishing and verification Issue #16](https://github.com/kinoko34077/kinotch-site-kit/issues/16)

Both pages are **M0 experimental verification fixtures**, not a released reusable library or migration of existing websites. Actual publication is controlled by `.github/workflows/m0-pages.yml` and post-deployment public URL tests; do not mistake repository visibility or successful toy tests for general product acceptance.

## Experimental M1 implementation

- [Core](packages/core/README.md): strictly validated version-1 site configuration, route links/breadcrumbs, layer precedence, fail-safe controller lifecycle; `0.0.0-experimental` is **private**, not a released package.
- [Vanilla and React adapters](packages/adapters/README.md): both Pages preview hosts use the same SiteDefinition; stable package build/SSR/consumer migration remain future work.
- [Owning core Issue #4](https://github.com/kinoko34077/kinotch-site-kit/issues/4), [adapter Issue #8](https://github.com/kinoko34077/kinotch-site-kit/issues/8) and [roadmap #10](https://github.com/kinoko34077/kinotch-site-kit/issues/10).

## Design priorities
End-user and developer usability > flexibility/extensibility/portability > coverage of standard expectations > reuse of maintained OSS > safety/performance and maintainability > convenience of legacy integration.

## Candidate stack (to validate in M0)
- Web Awesome **Core 3.5+** for optional page shell and UI controls; Core vs Pro and exact licenses must be audited.
- TanStack Hotkeys for common shortcut recording and bindings, under Kit-owned action registry.
- Optional i18next for localization and Pagefind for static search; optional Zag.js only for proven behavioral gaps.
- Native Web Components + TypeScript/ESM packages for vanilla HTML and React/Vite consumer adapters. No forced framework migration.
- Existing kinotch-editor-platform stays independent; optional versioned capability bridge only.

## User-facing modules
SiteDefinition/config core; responsive header/footer/nav/sidebar/hamburger/breadcrumbs; scoped themes incl dark/system; hotkeys; common Help/About/Contact/404/privacy/terms templates; optional SEO/search/i18n. Feature modules load only when selected; domain-specific layout, route and policy text stay consumer-owned.

## Canon and workflow
Read docs/SPECIFICATION.md then parent Issue and related decomposition. devflow AGENTS.md remains the cross-repo operating authority. UI and code guidance: kinoko34077/.ai-guidelines.
The repository was **created private by the devflow bootstrap default**, then made **PUBLIC on 2026-10-18 by explicit user request**, with visibility independently verified on GitHub. Public source visibility does **not** authorize consumer-site deployment, package release, credential/permission changes, or inclusion of secrets/private data. No license has been selected yet. Creation used trusted devflow repository-bootstrap.v1.
Representative consumers checked before bootstrap: microtone-piano, Gomoku-5D, frequency-warp-vst/web-demo, tarot-draw, lyric_reader_page, line-style-viewer. No consumer was changed.
