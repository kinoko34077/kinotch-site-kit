# Broad modular capability catalog and OSS selection — 2026-10-19

Authority: user instruction 2026-10-19, owning [#32](https://github.com/kinoko34077/kinotch-site-kit/issues/32), accepted [Site Kit specification](SPECIFICATION.md), [baseline research](RESEARCH_MODERN_WEB_BASELINE_2026.md), roadmap #10. **Implementation selection and performance evidence must be stored per module, not guessed.**

## A. New portfolio rule: broad availability, narrow runtime

- **Provide** a reusable implementation for generally useful website/Web App capabilities, with optional adapters for sites with unusual requirements.
- **Import/initialize only what a consumer chooses**. A library feature existing in the repo must have zero runtime, network, style or listener cost when the feature is disabled. Packaging must prove this with real code-splitting and import analysis.
- A feature may be **available but disabled** for a particular site; that is distinct from **unimplemented**, **experimentally verified**, **released**, and **accepted in a consumer**.
- Fixed header, consent, auth, analytics, push, payments, real-time collaboration, install prompts and remote API integrations must not run automatically. Their helpers may be built, but site-specific legal, credential, policy and irreversible actions remain site-owned.
- Prefer existing high-quality, maintained OSS and build adapters. Avoid copying dependencies into an internal fork unless real unmet UX/compatibility or maintenance needs justify it. One authoritative implementation per feature; don't stack competing focus/keyboard/modal systems.
- Actual license, pinned version, transitive notices, CSP, optional load and browser-support evidence are **required before release**, not established simply by linking a repository.

## B. Capability library map (target, not completion claim)

| Domain package | Capability entries | Consumer activates for | Ownership / expected safety |
|---|---|---|---|
| `core` / `runtime` | Config, typed manifests, route/provider, feature loader, event lifecycle | Every Site Kit consumer, only a tiny core | Explicit config, stable IDs, module opt-in |
| `shell` | header, nav, breadcrumbs, sidebar, footer, mobile drawer, skip link, immersive/compact layouts | Conventional site/complex app | No permanent overlaid HUD or layout jumps |
| `theme` | system/light/dark, accessibility contrast, motion, scoped tokens, saved preference | Almost any site | Icon-only switch, accessible names, stable first paint |
| `forms` | labels, errors, validation, autocomplete, keyboard/IME, drafts | Forms/transactional flows | Never discard invalid input or silently submit |
| `feedback` | loading/error/empty/offline/complete, inline notice, toast, alert, dialog, progress | App tasks | Truthful saved/applied/failed states; stable geometry |
| `search` | local small-site search, Pagefind full static index, dynamic search adapters, filter/sort | Content-rich site | No indexing of private/draft/unapproved content |
| `pages` | About/help/FAQ/contact/404/terms/privacy/cookies | Content site when enabled | Human-reviewed actual legal content only |
| `i18n` | locale text, RTL, number/date/plural, selected-language persistence, localized metadata | Multilingual sites | Lazy dictionaries/namespaces; untranslated fallback exposed |
| `actions` | global/page/dialog hotkeys, command palette, conflict/reset/scope, touch action | Tools/advanced sites | Never hijack IME/browsers; show binding at target |
| `history` | in-memory undo/redo, reset, compare and presets | Reversible editing | Bounded history; never imply remote undo |
| `work-state` | draft/dirty/saving/saved/failed/retrying, autosave scheduling, recovery/conflict | Editing apps | Explicit async acknowledgment; no fake success |
| `files` | open/import/export/preview/download/share/copy/print, format checks | Media tools/data apps | User-mediated access and truthful completion |
| `media` | video/audio playback, captions, playback speed, accessible transport, focus | Portfolio/audio/video sites | No surprise autoplay or disabled controls |
| `data` | list filtering/sort/page/virtualization, chart/table/clipboard, selection | Dashboards/catalogs | Accessible nonvisual fallback and deterministic state |
| `storage` | ephemeral/session/IndexedDB adapters, migrations, restore, optional cache | Local-first apps | Versioned schema, explicit quotas, no opaque cloud writes |
| `offline` | manifest, safe service worker/cache, update prompts, retry | PWA if useful | Explicit opt-in/versioned rollback; no universal install |
| `auth-bridge` | credential-provider UI states and capability interfaces | Sites with private accounts | Existing auth provider owns secrets, permissions, MFA |
| `privacy-bridge` | cookie/consent/analytics settings, export/delete flow hooks | Only if actual processing | No unreviewed legal statements; no implicit telemetry |
| `sharing` | share/copy/QR/OGP/social previews, link permissions | Public content sites | Distinguish public/private URLs |
| `help` | contextual help, keyboard legend, onboarding, changelog/about | All except very minimal sites | Short, inline, dismissible, no blocking first use |
| `editor-bridge` | published capability adapter to editor platform | Authorized editing sites | No editing bundle for ordinary viewers |
| `collaboration` | presence, concurrency, conflict resolution hooks | Real shared editing | Site-owned data model/ACL/audit |
| `commerce-bridge` | product review/confirmation/receipt API states | Transaction sites | Payment provider handles regulated processing |
| `qa` | a11y, browsers, latency/bytes/memory, failure and recovery | Every package | Reproducible measured gates, release rollback |

**Immediate implemented experiment** (#32): `packages/runtime/catalog.mjs` lazy import registry, `packages/features/history.mjs` bounded undo/redo, typed ESM contracts, Node tests and production esbuild split-bundle audit. All other named entries are tracked **targets**, not completed product modules.

## C. Primary OSS candidates: choose one per responsibility

| Requirement | Primary candidate, why | Alternate / limits | Integration verdict |
|---|---|---|---|
| Build and split ESM | [esbuild](https://esbuild.github.io/api/) (metafile, tree-shaking, dynamic import chunks; [architecture](https://github.com/evanw/esbuild/blob/main/docs/architecture.md)) | Rollup/Vite for host apps. Known esbuild splitting import-order caveat; measure with browser if multiple shared chunks | **Dev-only** esbuild `0.28.2` in #32 audit, not an app runtime |
| Optional shell/controls | [Web Awesome Core](https://webawesome.com/docs/components/page/) | Existing candidate/host adapter; check Core/Pro feature boundaries before release | Existing M0 demo only; keep replaceable |
| Key binding/recording | [TanStack Hotkeys](https://tanstack.com/hotkeys/latest/docs/overview) | Kit-owned action policy/IME guard, no duplicate global key handlers | Existing M0 demo + action registry |
| Static page search | [Pagefind](https://pagefind.app/) | Host local index useful for a handful of pages; dynamic site may need different engine | Prototype local search complete; Pagefind static adapter unaccepted |
| Localization | [i18next](https://www.i18next.com/) | Small dictionary/Intl for simple single-page case; load namespaces only on demand | **Experimental opt-in adapter implemented** at pinned 26.4.2, tested as lazy static JS; formal release acceptance still open |
| Floating position | [Floating UI DOM](https://floating-ui.com/docs/computeposition) | Use browser popover/dialog/Web Awesome first if adequate; don't import overlapping focus managers | Conditional candidate |
| Type/schema validation | [Zod Mini](https://zod.dev/packages/mini) (more tree-shakable than full Zod) | [Valibot](https://valibot.dev/), or existing custom validator when tiny | Compare measured build-size and semantics before replacing tested core |
| Tiny persistence | [idb-keyval](https://github.com/jakearchibald/idb-keyval) | `idb` for transactions, [Dexie](https://dexie.org/) for indexed queries; avoid requiring all | Candidate for explicit optional storage adapter |
| Stateful React hosts | [Zustand vanilla+React](https://github.com/pmndrs/zustand) | Host owns state; vanilla controller remains valid | Only consumer-selected host adapter |
| Server/data fetching | [TanStack Query core](https://tanstack.com/query/latest) | No network/data services in basic Site Kit; optional cache for real APIs | Only when real remote data exists |
| Offline caching | [Workbox](https://developer.chrome.com/docs/workbox/) | Native cache for extremely simple page; account for SW update/rollback | Not default |
| Icons | [Lucide](https://lucide.dev/) individual tree-shakable icons | Prefer native platform/icons or existing host assets | Only imported icons, no giant icon registry |
| Complex navigation/editor gestures | [Zag.js](https://zagjs.com/) for explicit state-machine gap | Native HTML plus Web Awesome where sufficient | Conditional / avoid competing focus logic |

**OSS review caveat:** GitHub project license labels and documentation are not transitive license/notices approvals. #3 owns the full license inventory and #9 owns security/performance/admission. Candidate versions not yet installed must not be claimed as integrated. All optional modules must remain entirely absent from a disabled site's eager entry and unexpected network graph.

## D. System-wide performance and efficiency contract

1. **Static modularity**: one ESM export per feature; no barrel-import that eagerly evaluates every module; dynamic `import()` for optional packages; no initialization by just importing the manifest.
2. **Build metrics**: startup chunk and per-feature gzip/Brotli/raw bytes, shared chunk duplication, eagerly reachable input graph, disabled-feature JS cost, fonts/CSS and assets. Baselines recorded by CI with artifact, not guessed.
3. **Runtime metrics**: JS initialization/evaluation, input latency and stalls (INP), cold navigation LCP, layout shifts (CLS), peak heap, event listener count, load/unload cleanup; compare desktop and mobile Safari where available.
4. **IO/cache**: cache immutable fingerprinted chunks, lazy parse localization/search indices, avoid polling when hidden, bound virtual lists/data and parse cost; neither prerender nor prefetch is automatically free.
5. **UX quality**: a cheaper download must not cause first-interaction jank, delayed menu opening, lost focus, poor keyboard discoverability, or erased drafts. Prefer lazy load after explicit intent, with truthful local loading/retry UI.
6. **Safety**: credentials/permissions/privacy and irreversible writes require independent validation; failed optional module must not block basic reading/work; do not fake success.
7. **Refactor methodology**: same observable behavior -> baseline -> isolated code edit -> unit/browser and accessibility tests -> compare real byte/runtime metrics -> retain only demonstrable improvements.
8. **Release boundary**: build/CI success ≠ paid-provider approval, code release, physical iPhone validation, legal approval or adoption in existing sites.

## E. Work progression after first slice

- E1 #32 and #8: tested optional loader + isolated bundler outputs + size report; prove disabled modules cost zero.
- E2 #5/#6/#7: distinct header/theme/hotkey/search/page/i18n slices and user-facing host composition, physical browser findings; adopt mature OSS one responsibility at a time.
- E3 #32/#9: undo/state/recovery/files/storage/error primitives as independent app-task packages, explicit operation audit and iPhone/IME.
- E4 #8/#9: reproducible pinned distribution, scoped CSS/no global collisions, import manifests, licenses/SBOM and actual cold-start CPU/memory budgets; test an ordinary and an immersive app.
- E5 #10: per-consumer owner-authorized opt-in/rollback, never blanket transplant.

This catalog is authoritative **for the user's new availability/selection principle**, but individual module implementations/versions/gates remain their respective owner Issues and acceptance checks.
