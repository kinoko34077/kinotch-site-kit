# M0.2 — OSS composition and technical feasibility audit (2026-10-18)

**Owner:** [Issue #3](https://github.com/kinoko34077/kinotch-site-kit/issues/3). **Status: PARTIAL / VANILLA+REACT CHROMIUM+WEBKIT MINIMAL SMOKE PASS; COMPLETE M0 UX AND DEPENDENCY GATES UNVERIFIED**. Documentation/package registry research is not proof of installed, tested integration. No paid package or external account configured.

## 1. Candidate decision table (as of 2026-10-18)

| Candidate/version reference | Evidence | Decision and support level |
|---|---|---|
| **Web Awesome Core `@awesome.me/webawesome@3.14.0`** | [Core license](https://webawesome.com/license), [Page](https://webawesome.com/docs/components/page), [3.5 changelog](https://webawesome.com/docs/resources/changelog), [npm package](https://www.npmjs.com/package/@awesome.me/webawesome) | **PREFERRED FOR M0 POC, NOT ACCEPTED**: MIT Core, `wa-page` moved Pro→Core in 3.5; supports optional slots including header/navigation/main/footer. Actual 3.14.0 installation, CSS scope, semantic landmarks, browser and transitive license verified only after reproducible build. |
| **TanStack `@tanstack/hotkeys@0.11.0` + `@tanstack/react-hotkeys@0.13.0`** | [Vanilla/React installation](https://tanstack.com/hotkeys/latest/docs/installation), [HotkeyRecorder](https://tanstack.com/hotkeys/latest/docs/reference/classes/HotkeyRecorder), [ES2022/ESM constraints](https://tanstack.com/hotkeys/latest/docs/overview), [npm React package](https://www.npmjs.com/package/@tanstack/react-hotkeys) | **PREFERRED BEHIND REPLACEABLE ADAPTER, NOT ACCEPTED**: core non-React recorder and React hook exist; MIT package; current line marked **alpha**. ESM-only ES2022, Node>=20 in Node contexts. Pin exact version and guard API changes, key scope, IME and listener lifetime. |
| **i18next** | [official docs](https://www.i18next.com/) | OPTIONAL (locale adapter). Opt-in adapter implemented at pinned i18next 26.4.2 with lazy import; tested in experimental standalone static ESM, **not** formal release acceptance. Not installed by default in the consumer runtime. |
| **Pagefind** | [official docs](https://pagefind.app/) | OPTIONAL (build-time index of compatible static content). Dynamic sites use separate search provider; no blind runtime load. |
| **Zag.js** | [official docs](https://zagjs.com/) | **DEFER** unless a demonstrated unsolved interaction-state gap. Avoid overlapping dialog/drawer implementations. |
| **Shoelace 2.20.1** | [repo sunset notice](https://github.com/shoelace-style/shoelace), [successor migration](https://webawesome.com/docs/resources/migrating-from-shoelace) | **NOT PRIMARY**: MIT but upstream discontinued active development. Historical fallback/technical comparison only, not an equivalent maintained default. |

## 2. Current Core vs Pro license boundary (correction)
`wa-page`, `wa-breadcrumb`, `wa-dialog`, `wa-drawer`, `wa-toast`, `wa-toast-item`, and ordinary buttons/menus are **Core** at the pinned 3.14.0 reference. Crucially, the **official [3.11.0 changelog](https://webawesome.com/docs/resources/changelog)** (2026-07-30) documents `wa-toast` and `wa-toast-item` moving from Pro into Core, corroborated by the current [Toast docs](https://webawesome.com/docs/components/toast) and [Toast Item docs](https://webawesome.com/docs/components/toast-item). A separately supplied toast library is not needed merely for the Core free requirement. An older version of the [Core license page](https://webawesome.com/license) surfaced a stale navigation catalog marking toast Pro; chronological release notes and component-specific current docs take precedence. **Combobox**, **Date Input/Picker**, **File Input**, charts and Pro assets remain separate licensing questions. Core license permits commercial use/self-hosting with MIT notices; **never silently bundle Pro assets**. Avoid copying Pro patterns/themes/icons.
License requirement: preserve MIT copyright/permission notices for packages and bundled substantial portions; do not use Web Awesome branding in a way implying affiliation. New Site Kit's own repository license remains undecided until a separate license choice.

## 3. `wa-page` architecture and ownership precautions
Web Awesome documents optional named slots (`banner`, `header`, `subheader`, `navigation-header`, `navigation`, `navigation-footer`, `main-header`, `main-footer`, `aside`, `footer`); empty regions omitted. The host must still provide true semantic landmarks and titles. Validate slot arrangement and keyboard focus in browser, rather than assuming the visual container creates accessible `<main>`/`<nav>` regions automatically.
Use `SiteDefinition` route/action registry independent of Web Awesome internal attributes/DOM IDs; React consumer controls its VDOM and lifecycles, not Site Kit direct patching of React children. For immersive (audio/game/chat) hosts turn off shell parts independently without recreating hidden/unused component instances.

## 4. Proof matrix
| Requirement | Current evidence status | Next reproducible check |
|---|---|---|
| Web Awesome Core `wa-page` available since 3.5 | **DOC VERIFIED** (official changelog) | Install `3.14.0` and render slots; test no global CSS leaks |
| Core MIT + self hosting | **DOC VERIFIED**, transitive dependency audit **UNVERIFIED** | Install with frozen lockfile, inspect SBOM and notices, exclude Pro assets |
| Toast/Toast Item in Web Awesome Core 3.14.0 | **DOC VERIFIED**: v3.11.0 changelog explicitly moved them Pro→Core | Test pinned import/visual behavior in actual installed package; no substitute library required for licensing alone |
| TanStack recorder exists vanilla & React | **DOC VERIFIED** | M0 Vanilla core `0.11.0` / React hook `0.13.0` separate-host smoke PASS; extend shared-host keyboard/IME/conflict, remount/dispose verification |
| Stable TanStack API | **NOT PROVEN** (current docs/npm identify alpha) | lock exact version behind Site Kit facade; CI regression on upgrade |
| Direct runtime packages installed in GitHub CI | **PASS** in public Ubuntu standard runner; isolated local path still BLOCKED | Record full frozen lockfile and transitive SBOM before release |
| Live `wa-page`+TanStack combined demo | **SMOKE PASS** on pinned versions: 4 Playwright tests (vanilla+React in Chromium+desktop WebKit) | Broaden focus/IME/mobile/WebKit/CSS collision scenarios; real device separately |
| React 19 and vanilla host coexistence | **BASIC SMOKE PASS** with actual package imports + build of both host HTML; shared `SiteDefinition` and cross-repo collision still UNVERIFIED | Continue M1 contract + cross-host state, remount/focus/full scope tests |
| Keyboard-focus/ARIA/default route | **UNVERIFIED** | Browser events/focus/IME and mobile viewport tests |
| External-resource and policy safety | **UNVERIFIED** | Offline/self-host bundle, CSP, no third-party HTTP by default |

## 5. Actual bounded test-path evidence and recovery
- Isolated execution environment: `node v22.16.0`, `npm v10.9.2`, local `/usr/bin/chromium`, Python Playwright installed.
- `npm view @awesome.me/webawesome version --fetch-retries=0 --fetch-timeout=8000`: **FAILED EAI_AGAIN** DNS resolution of `registry.npmjs.org`. This establishes a **network/tool path failure, not incompatibility of Web Awesome**.
- Local platform baseline Chromium navigation to `file:///...` and `http://127.0.0.1:<port>/...`: both **FAILED net::ERR_BLOCKED_BY_ADMINISTRATOR**. No successful browser scenario or successful vendor integration was observed; do not claim PASS.
- **Recovery path completed for the narrow package/browser smoke via GitHub native public CI:** [PR #14](https://github.com/kinoko34077/kinotch-site-kit/pull/14), [run #39091136344](https://github.com/kinoko34077/kinotch-site-kit/actions/runs/39091136344). Details below. Physical iPhone/older Safari and complete dependency/license/performance verification remain unverified; no RDC or credential workaround used.
- Distinguish `UNVERIFIED` from fail: pending use of a normal project workflow means no technical rejection of selected vendors. Native CI execution may depend on Actions free quota; verify allowable route before execution. Avoid automatic paid providers.

## 6. Next technical checks in strict order
1. Preserve Web Awesome Core Toast/Toast Item as a built-in candidate for v3.14.0 (moved to Core in 3.11.0); avoid depending on stale sidebar/license catalogs; confirm actual installed package.
2. Build **vanilla ESM + React/Vite** isolated fixture on pinned versions. Run page slot, burger/drawer focus, theme, breadcrumb with basePath, shortcut record/cancel/conflict/IME and cleanup; capture browser evidence and bundle graph.
3. Audit dependency trees and free/Pro boundary. Test alternative UI provider only if a hard failure or prohibitive size/styling collision is verified.
4. Converge with [M0 site inventory](M0_SITE_INVENTORY.md) for architecture gate. Keep M1 implementation blocked until M0 acceptance criteria or explicitly narrowed, recorded exceptions.

**Disposition: Issue #3 remains OPEN**. A runnable pinned direct-dependency M0 fixture has a **4/4 two-host, two-engine** smoke PASS. **Production package, full contract, other browsers/IME/mobile and transitive licenses remain unaccepted**; no customer-facing Site Kit has been released.

## 7. Real GitHub-native execution evidence (M0 narrow PASS)
- **[PR #14](https://github.com/kinoko34077/kinotch-site-kit/pull/14)** includes `spikes/m0` with an isolated Vite fixture: `index.html` vanilla ESM and `react.html` React 19, importing Web Awesome Core **3.14.0**, TanStack Hotkeys and React Hotkeys **0.13.0**. No consumers or published pages changed.
- **[CI run #39091136344](https://github.com/kinoko34077/kinotch-site-kit/actions/runs/39091136344)** (Ubuntu standard public runner, Node 22): package install **PASS**, direct package identity/licenses checked (`@awesome.me/webawesome 3.14.0 MIT`, `@tanstack/hotkeys 0.13.0 MIT`, `@tanstack/react-hotkeys 0.13.0 MIT`), Playwright Chromium headless **2/2 PASS** (vanilla custom elements/theme/Toast/recorder/dispose; React host state/recorder/unmount), build **PASS** emitting **both** `dist/index.html` and `dist/react.html`.
- Exact built fixture outputs: shared CSS `109.86 kB` raw / `15.72 kB` gzip; `vanilla` JS `26.92 kB` / `9.69 kB` gzip; shared JS chunk `200.26 kB` / `50.11 kB` gzip; React JS `215.97 kB` / `68.70 kB` gzip. **These are fixture bundles, not per-site or per-feature performance budgets**, and require import-graph decomposition before setting production targets.
- **Warnings remain:** Vite default CSS target reported unsupported transformation for certain nesting selectors in vendor CSS under older Chrome/Edge/Firefox/Safari targets. Older Safari/Chromium and Firefox compatibility outside the tested Chromium+desktop WebKit versions remains **UNVERIFIED**; do not call warnings harmless without reproducing legacy tests.
- Runtime measurement scope: Chrome Headless Shell `153.0.8010.12`, Playwright `1.63.0`, Vite `6.2.3`. No screenshots, touch hardware, keyboard conflict/IME, large pages, Firefox, older-version Safari, network silence, Core-vs-Pro asset audit beyond direct package identity, full SBOM or stable transitive lockfile were proven.
- Decision: **continue** into extended M0 gates, including real-device checks and frozen dependency provenance; do **not** claim M0 fully accepted, M1 started, public npm release, or consumer adoption solely from two basic smoke tests.

## 8. Cross-engine navigation and build repeat — final bounded checkpoint
- Final [PR #14](https://github.com/kinoko34077/kinotch-site-kit/pull/14) merged after exact-head successful **[GitHub Actions #39091308467](https://github.com/kinoko34077/kinotch-site-kit/actions/runs/39091308467)**. Job `browser-smoke` **SUCCESS**. CI logs explicitly show **4/4 PASS** across **Chromium and desktop WebKit**, each running **Vanilla ESM and React 19** scenarios. This supersedes the earlier 2/2 Chromium-only result in §7.
- Added narrow mobile-layout checks of `wa-page` view mode and menu `nav-open` open/close via button/Escape in vanilla; React tests also verify mobile view with host-owned state preserved. Both built `dist/index.html` and `dist/react.html` successfully. Important: desktop WebKit at a simulated 390px viewport **is not real iPhone Safari**, and the tests do not cover touch hardware or mobile browser chrome.
- Candidate package versions and direct MIT metadata unchanged. Current Vite CSS nesting transformation warnings under old compilation targets persist; an additional compatibility gate is required. Realistic styling collision, access-control isolation, accessibility audit, keyboard/IME conflict matrix, no telemetry/no third-party network, frozen transitive lockfile/SBOM and full SiteDefinition contract **remain UNVERIFIED**.
- Current decision: **M0 partial PASS**, not M0 admission. Next work is targeted keyboard/IME/focus tests, asset/license freezing and baseline mobile/consumer browser observations; only after M0 gate accept should shared Core API work proceed.

## 2026-10-20 current TanStack dependency compatibility checkpoint

- The 2026-10-18 PR #14 direct-core `0.13.0` examples in §7–8 above describe **historical run evidence**, not the current M0 installed graph.
- **Current verified M0 pins after [PR #50](https://github.com/kinoko34077/kinotch-site-kit/pull/50):** Vanilla `@tanstack/hotkeys@0.11.0`; React `@tanstack/react-hotkeys@0.13.0`. The latter's exact transitive core requirement is `0.11.0`, so this preserves the upstream dependency contract without an npm override.
- [Native PR CI #39397610539](https://github.com/kinoko34077/kinotch-site-kit/actions/runs/39397610539) **PASS**, including a strict one-hoisted-installed-core guard, no nested second `@tanstack/hotkeys` copy, and real Chromium+desktop WebKit smoke/build for both demo hosts. This resolves the observed **duplicate dependency instance**, not all product keyboard interoperability. The Kit-owned action registry and optional adapters remain independently managed.
- **Still not accepted:** same-page combined React/Vanilla listeners, IME/keyboard-layout/focus collision matrix, physical iPhone Safari and all consumer migrations. Keep owner [#6](https://github.com/kinoko34077/kinotch-site-kit/issues/6) open until its full acceptance evidence exists.
