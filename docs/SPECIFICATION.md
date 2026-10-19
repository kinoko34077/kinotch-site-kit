# KiNoTch. Site Kit — Initial Canonical Specification (2026-10-18)

## S0. Purpose, authority, boundary and status
One reusable, configurable **website application shell + standard-feature library** for multiple KiNoTch. sites. This is not a visual editor, website builder, backend platform or monolithic framework. Develop shared implementations once and reuse them through versioned packages/contracts rather than copying source to every site.
Status as of 2026-10-19: canonical product specification remains **partially implemented, NOT accepted or released**. M0 browser demonstration is publicly deployed and tested; an experimental pure SiteDefinition v1 core and minimal Vanilla/React adapter proofs exist (PR #23, #24, #25). The M1 product milestone, dependency/license/physical-device acceptance, package publication and consumer adoption remain incomplete. Current versioned runtime code is under `packages/core/` and `packages/adapters/`, verified via native Node, TypeScript and Pages browser tests; the stable public API is not frozen.
Visibility record: repository created PRIVATE via devflow bootstrap #713 and changed to PUBLIC on 2026-10-18 by the user's subsequent explicit instruction; GitHub visibility was independently verified. Public repo visibility does not mean first package release, existing-site publication, or permission to include secrets/private data. Live execution roadmap is maintained by repository Issue #10.
Priorities: actual end-user + developer usability; flexibility/extensibility/portability; breadth of standard features; maximal reuse of mature maintained OSS; performance/safety/maintainability; existing-site migration convenience last. Never sacrifice the first priorities merely to preserve a legacy UI.
Authority hierarchy: current user decision > individual consumer's domain rules > this library spec for shared behavior > development guidelines. Operational authority: kinoko34077/devflow/AGENTS.md; code/UX policies: kinoko34077/.ai-guidelines/guidelines/AI_CODING_POLICY.md, UI_UX_POLICY.md, USABILITY_POLICY.md and UI protocol pack.
Related but separately owned: kinotch-editor-platform (GrapesJS+Moveable/Selecto+dnd-kit, devflow #702/#705), frequency-warp-vst typed parameters, kinotch-repository-base, kinotch-runtime, kinotch-identity. Integrate only through explicit versioned optional adapters; do not copy their implementation, hijack their responsibilities or presume accepted compatibility.

## S1. Observed heterogeneous consumers and target support
Verified main branches (2026-10-18):
- microtone-piano: React 19 + Vite; package.json.
- Gomoku-5D: React 19 + Vite; package.json.
- frequency-warp-vst/web-demo: static HTML/CSS/JS with performance-sensitive audio UI.
- tarot-draw/web: vanilla HTML/JS/CSS, with Pages build + Cloudflare Worker portions.
- lyric_reader_page: static HTML and JS/assets, GitHub Pages oriented.
- line-style-viewer: static HTML/CSS/JS, existing embedded Visual Editor distribution.
Native Web Components and CSS custom properties form the browser-facing common path, not React-only shell. TypeScript/ESM source with built browser bundles. Provide thin React integration without controlling React's owned DOM. Vite consumers import npm-package-style artifacts; static sites can import pinned distributable ESM/CSS without installing a framework.
Support tiers must be declared/tested explicitly: vanilla browser ESM P0; React/Vite P0; plain static HTML via pinned distribution P0; other frameworks P1 adapters; legacy browsers and no-JS content graceful fallback; native VST3/Canvas not automatically supported. No forced rewrite to Astro/Nuxt/Next/React.

## S2. Module architecture and packages (provisional names, stable responsibilities)
- core: typed SiteDefinition, schema validation, capability registry, lifecycle, configuration layering, route metadata, shared action/state contract and diagnostics.
- shell: optional semantic regions (banner/header/subheader/nav/main/aside/footer), responsive nav, mobile disclosure, sidebars, navigation hierarchy, breadcrumbs, page title and metadata.
- components: Web Awesome **Core**-backed buttons, menu/dialog/drawer/breadcrumb/tabs/form/callout/tooltip/**Toast/Toast Item (moved to Core in v3.11.0)**. No free assumption for Pro-only combobox, date/file inputs, charts or themes. Maintain a replaceable facade without leaking vendor DOM IDs to app API; validate pinned package feature availability at runtime.
- theme: CSS custom-property design tokens, system/light/dark, scoped theme overrides, high contrast/reduced motion where supported, preference persistence.
- shortcuts: action registry, scope/priority, input safety, record/edit/reset/conflict detection, OS-specific shortcut display, menu-local shortcut discovery and keyboard-independent route.
- pages: optional Home/About/Help/Contact/404/Privacy/Terms/Cookies structure and links; legal text provided or reviewed by each site, never inferred as legal compliance.
- optional-search: Pagefind integration for suitable indexed static content, adapter for dynamic sites; lazy-loaded, no required third-party search service.
- optional-i18n: i18next-based locale adapter, fallback policy, locale-aware dates/metadata; no mandatory language loader.
- optional-integrations: SEO metadata/sitemap/OGP generation at build adapters; analytics/CMP/auth integrations only opt-in after explicit needs, never implicit.
- adapters: vanilla-dom, react (SSR/hydration-aware integration without unauthorized React-owned DOM manipulation), static-site-build (base-path and asset manifest) and site-specific optional connectors.
- editor-bridge (optional): capability-scoped public contract with kinotch-editor-platform; editor code never loaded into ordinary pages unless enabled.
One core authority, tree-shakeable optional feature entries, separately pinned dependency/adapter versions, no mandatory runtime service.

## S3. Concrete SiteDefinition v1 target contract
Inputs: site id/name/baseUrl optional/basePath, layout profile ('content'|'application'|'immersive'|'custom'), route definitions (stable id, path, title, parent, nav inclusion, breadcrumb override), structured nav groups, theme token map/preset, features toggles, shortcuts action bindings, external service adapters, page templates/content, optional locale.
Outputs: mount/unmount shell and independently reusable features, navigation resolved from route registry, metadata/render state, typed events and diagnostic errors. Provide compile-time TypeScript types PLUS runtime schema validation for JSON inputs.
Configuration precedence: library defaults < chosen preset < site config < allowed page/route config < explicit temporary user preference. Identify which fields permit page/user override, and expose provenance; never allow a page preference to override access-control policy.
State belongs to host/explicit state stores, never DOM as sole authoritative value. Lifecycle methods mount/update/dispose are idempotent and unsubscribe all listeners. Stable IDs independent of translated display strings. No duplicate shared keyboard or navigation handlers after remount.
Feature flags default to off for optional heavy services; ordinary site must remain readable if one optional module fails. Provide explicit warnings and fallback, not fabricated success. Externally consequential permission/auth/data integrity failures remain fail-closed.
Actual API names, package names and preset list are provisional until PoC; a documented schema with versioning and migration is required for first release.

## S4. UX/behavior: standard, discoverable, context-preserving
Shell: Web Awesome Core wa-page >=3.5.0 candidate (now Core); slots require developer-provided semantic header/nav/main/footer elements because wa-page does not itself inject content section landmarks. Header/footer and mobile navigation are **optional**, not permanently overlaid on immersive/audio editors. Keyboard navigation, logical focus order, escape handling, touch targets and correct aria states mandatory.
Navigation: desktop disclosure and small-screen drawer/hamburger, active route, focus return, back/forward, nested menus, skip-to-content; route-driven breadcrumbs with explicit exceptions; route base-path, hash/static-404 semantics validated per consumer; do not hijack each site's own router.
Themes: system/light/dark with stable initial paint (avoid flicker), local preference override and reset, prefers-reduced-motion, contrast and scoped tokens. Avoid global CSS collision/forced reset for existing app style, arbitrary z-index and fixed placement. Header/footer responsive with safe-area support.
Shortcuts: single action registry with namespaced IDs, scope (global/page/dialog/edit), priority, conflict checks, editable-input/IME safety, browser/system shortcut noninterference, React and vanilla mount cleanup. Show assigned shortcuts at relevant menu/control; allow record/rebind/remove/reset where enabled. Mouse/touch path must exist for required actions.
Standard pages: 404, Help, About, contact, privacy, terms; provide templates + clear completion status, not fictitious privacy/cookie promises. Do not insert a useless policy page on a site that has no such applicable contract. Footer/menu links generated from explicitly enabled pages.
Errors/loading/empty/offline or partial failures: recover gracefully for unprivileged portions, keep input/scroll/selection, stable non-jumping status displays, optional toast overlay; do not transform minor notice into full-screen blocker. Contextual help near target, avoid helper text proliferation. Explicit Undo/restore only for reversible owned settings/operations.

## S5. Candidate OSS composition / licensing / replacement policy
Web Awesome Core: layout/components/theme first evaluation; Core license reported MIT, but confirm actual package version, Core vs paid Pro features, notices and exact distribution before inclusion. wa-page moved to Core >=3.5.0; do not presume older Core.
TanStack Hotkeys: framework-agnostic recording and bindings plus React adapter; confirm package/runtime compatibility (current ESM/ES2022) and accessible editable-input behaviors; action registry stays Kit-owned.
i18next: only when locale feature enabled. Pagefind: static build indexing where compatible; dynamic site must not be forced into static indexing.
Zag.js: optional state-machine behavior for complex interactions, **only if** a proven gap remains, not a duplicate universal controls library.
AstroWind, Nuxt UI and Mantine are reference/starter/stack-specific alternatives, NOT mandatory mixed runtime dependencies. Avoid combining multiple libraries to implement the same dialog/menu event handlers. All dependency versions pin/test; license/SBOM and transitive notices tracked; do not adopt paid Pro components or runtime SaaS inadvertently.
Sources: https://webawesome.com/docs/components/page ; https://webawesome.com/license ; https://tanstack.com/hotkeys/latest/docs/reference/classes/HotkeyRecorder ; https://pagefind.app/ ; https://www.i18next.com/
Fallback if candidate violates requirements: compare alternative Web Components implementations using the same contract, document UX/performance/license impact, then change the vendor adapter, not every consumer.

## S6. Delivery, security, policy and performance
Distribution model: versioned ESM package + CSS/assets and pinned static/browser distribution, optional React adapter; independently importable modules and manifest for static hosts. Consumer pins exact tested version (lockfile or immutable asset version), reproducible builds and defined rollback; no CDN floating latest or forced auto-update. Offline-capable/self-hosted asset option with no surprise third-party network requests.
Security: no injected unchecked arbitrary HTML, scripts, URLs, or remote fetches from config; text by safe DOM/text API, imported config schema validation, CSP-aware distribution, no secret storage/exposure, no privileged editing or auth boundary from theme/site preferences. Privacy: no telemetry/analytics/cookies except explicitly enabled and documented; consent and legal text responsibility per consumer.
Quality: keyboard/touch/screenreader checks, mobile Safari real-device acceptance where available, Chromium/Firefox/WebKit desktop matrix, reduced motion, zoom, screen reader semantics, contrast checks, normal/broken/empty state, refresh/reentry/fallback. Per-feature bundle graph, zero editor bundles for non-edit mode, no listeners after disposal. Establish baseline and run differential performance on fixed fixtures; measurable agreed thresholds before release, not fabricated zero-cost claim. Track issues PASS/FAIL/UNVERIFIED/N/A with evidence.
Devflow rules: Issue-first work, trusted repository-bootstrap workflow, no direct one-off repo creation, no credential changes/permission expansion, no deploy/release without separate authority, no destructive consumer migration; new repo read-only command receiver if accepted bootstrap permits. License for this new repository remains undecided until confirmed.
Adoption: compatibility/UX baseline of representative sites, pilot implementation ONLY after explicit site-owned work authorization, per-site regression and rollback. Do not touch users' live public sites in bootstrap phase.

## S7. Milestone plan with acceptance gates
M0 Inventory: consumer inventories + versions, dependency licenses/Core feature availability, framework and static delivery feasibility; compare realistic alternatives; acceptance is evidence table and vendor decision not just theoretical claims.
M1 Contract/Core: schema v1, config merging/provenance, lifecycle, minimal vanilla/React smoke fixtures, route provider adapters; tests for invalid/partial values/cleanup.
M2 Shell/Theme: wa-page Core integration with real semantic landmarks, optional regions, mobile menu/breadcrumbs, dark mode & preference persistence, navigation tests and UX.
M3 Features: shortcuts recording/conflict/editable-input/IME; templates/legal content gating; optional search/i18n/metadata, no coupling to unused modules.
M4 Packaging/QA: static ESM/CSS + bundler packages, version pin/revert, dependency notices, security audit, a11y/real iPhone/performance acceptance, public release policy separate.
M5 Consumer rollout: one at a time, explicitly scoped site-owner approval, comparative screenshots/tasks and rollback; preserve domain behavior.
Evidence: exact commit/versions, reproducible commands, test results, known unsupported surfaces, latency/layout measurements, and real device vs simulated evidence separated. No milestone is DONE based only on spec text.

## S8. Initial exclusions and unresolved decisions
Not in this bootstrap: code implementation, new auth system, publishing sites, cookies/analytics automatically, private-to-public visibility flip, paid plans, privileged workflow execution, automatic replacement of existing editors, moving each site to a new framework.
Unresolved and to test before release: vendor adapter API, full supported browser matrix, exact names/versioning/registry, SSR/no-JS behavior, routing models, which template pages enabled per app, numeric performance budgets, external UI/editor integration details, license/attribution text.
Trust state: all M0-M5 unimplemented by repository bootstrap. Initial issues are specifications/work orders only.

## S9. Broadened modular availability and resource-efficiency policy (2026-10-19)

**Current explicit user direction:** All generally useful website, page, and Web App capabilities should **exist in a reusable shared Site Kit module** where technically appropriate, even if any one site may not need them. Consumer sites **select and import only needed features**; optional functions must not impose runtime dependencies, network calls, UI overlays, storage or permissions when disabled. This replaces any narrow interpretation of "optional" as "do not develop the feature unless a particular consumer currently needs it".

Fixed headers, consent banners, auth/account services, payments, push, PWA and analytics remain *optional to activate*. Building their configurable adapters is allowed, but enabling them, assuming legal terms, executing a paid provider, granting credentials or altering a consumer site is never implied. Shared Site Kit cannot replace the site-owned identity, permission, data, legal or domain processing authorities.

Performance and maintainability are first-class implementation acceptance goals **alongside** usability, capability breadth and portability, not a feature to postpone until all modules exist. Apply independent ESM entrypoints, dynamic opt-in loading, verifiable tree-shaking, isolated vendor adapters, version-pinned builds, automated per-chunk raw/gzip/Brotli cost reports, runtime latency/heap/CLS measurements, and failure/recovery tests. Zero cost for disabled modules means **not evaluated or loaded at startup**, not that a large library repository has no source files. Avoid premature numeric field-performance claims from simulated browsers.

Latest module inventory, OSS choices and layered gates: [MODULAR_CAPABILITY_CATALOG.md](MODULAR_CAPABILITY_CATALOG.md), owner [#32](https://github.com/kinoko34077/kinotch-site-kit/issues/32). This policy broadens the intended *library availability*, **not** implicit deployment/publishing, security changes, paid services, or acceptance status for individual features.
