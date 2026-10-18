# M0.2 — OSS composition and technical feasibility audit (2026-10-18)

**Owner:** [Issue #3](https://github.com/kinoko34077/kinotch-site-kit/issues/3). **Status: PARTIAL / VENDOR RUNTIME PROOF UNVERIFIED**. Documentation/package registry research is not proof of installed, tested integration. No paid package or external account configured.

## 1. Candidate decision table (as of 2026-10-18)

| Candidate/version reference | Evidence | Decision and support level |
|---|---|---|
| **Web Awesome Core `@awesome.me/webawesome@3.14.0`** | [Core license](https://webawesome.com/license), [Page](https://webawesome.com/docs/components/page), [3.5 changelog](https://webawesome.com/docs/resources/changelog), [npm package](https://www.npmjs.com/package/@awesome.me/webawesome) | **PREFERRED FOR M0 POC, NOT ACCEPTED**: MIT Core, `wa-page` moved Pro→Core in 3.5; supports optional slots including header/navigation/main/footer. Actual 3.14.0 installation, CSS scope, semantic landmarks, browser and transitive license verified only after reproducible build. |
| **TanStack `@tanstack/hotkeys` + `@tanstack/react-hotkeys@0.13.0`** | [Vanilla/React installation](https://tanstack.com/hotkeys/latest/docs/installation), [HotkeyRecorder](https://tanstack.com/hotkeys/latest/docs/reference/classes/HotkeyRecorder), [ES2022/ESM constraints](https://tanstack.com/hotkeys/latest/docs/overview), [npm React package](https://www.npmjs.com/package/@tanstack/react-hotkeys) | **PREFERRED BEHIND REPLACEABLE ADAPTER, NOT ACCEPTED**: core non-React recorder and React hook exist; MIT package; current line marked **alpha**. ESM-only ES2022, Node>=20 in Node contexts. Pin exact version and guard API changes, key scope, IME and listener lifetime. |
| **i18next** | [official docs](https://www.i18next.com/) | OPTIONAL (locale adapter). No exact version pinned or browser bundling tested yet; do not install by default. |
| **Pagefind** | [official docs](https://pagefind.app/) | OPTIONAL (build-time index of compatible static content). Dynamic sites use separate search provider; no blind runtime load. |
| **Zag.js** | [official docs](https://zagjs.com/) | **DEFER** unless a demonstrated unsolved interaction-state gap. Avoid overlapping dialog/drawer implementations. |
| **Shoelace 2.20.1** | [repo sunset notice](https://github.com/shoelace-style/shoelace), [successor migration](https://webawesome.com/docs/resources/migrating-from-shoelace) | **NOT PRIMARY**: MIT but upstream discontinued active development. Historical fallback/technical comparison only, not an equivalent maintained default. |

## 2. Important licensing and free-feature correction
`wa-page`, `wa-breadcrumb`, `wa-dialog`, `wa-drawer`, and ordinary button/menu controls are **Core documentation features**; the Core license permits commercial use and self-hosting if notices are included. However, the Web Awesome catalog currently explicitly marks **Toast/Toast Item**, **Combobox**, **Date Input/Picker**, **File Input**, and charts as **Pro**. The initial `docs/SPECIFICATION.md` describes “toast” among the Web Awesome-backed controls: **do not interpret that as Core capability**. For status notices use Core-available `wa-callout`/ordinary DOM + independent thin nonblocking overlay if justified, or choose a separately licensed maintained OSS; **never silently bundle Pro assets**. Pro patterns/themes/icons similarly require per-asset review, even where layout docs are open.
License requirement: preserve MIT copyright/permission notices for packages and bundled substantial portions; do not use Web Awesome branding in a way implying affiliation. New Site Kit's own repository license remains undecided until a separate license choice.

## 3. `wa-page` architecture and ownership precautions
Web Awesome documents optional named slots (`banner`, `header`, `subheader`, `navigation-header`, `navigation`, `navigation-footer`, `main-header`, `main-footer`, `aside`, `footer`); empty regions omitted. The host must still provide true semantic landmarks and titles. Validate slot arrangement and keyboard focus in browser, rather than assuming the visual container creates accessible `<main>`/`<nav>` regions automatically.
Use `SiteDefinition` route/action registry independent of Web Awesome internal attributes/DOM IDs; React consumer controls its VDOM and lifecycles, not Site Kit direct patching of React children. For immersive (audio/game/chat) hosts turn off shell parts independently without recreating hidden/unused component instances.

## 4. Proof matrix
| Requirement | Current evidence status | Next reproducible check |
|---|---|---|
| Web Awesome Core `wa-page` available since 3.5 | **DOC VERIFIED** (official changelog) | Install `3.14.0` and render slots; test no global CSS leaks |
| Core MIT + self hosting | **DOC VERIFIED**, transitive dependency audit **UNVERIFIED** | Install with frozen lockfile, inspect SBOM and notices, exclude Pro assets |
| Toast should be Core | **FAIL**: currently Pro catalog | remove Core assumption; use distinct OSS/native solution |
| TanStack recorder exists vanilla & React | **DOC VERIFIED** | Run keyboard/IME/conflict, remount/dispose tests against `0.13.0` |
| Stable TanStack API | **NOT PROVEN** (current docs/npm identify alpha) | lock exact version behind Site Kit facade; CI regression on upgrade |
| Current browser/runtime dependencies installed | **BLOCKED** in isolated runner | Install through approved existing npm-capable workflow; do not add token/provider/paid service |
| Live `wa-page`+TanStack combined demo | **UNVERIFIED** | Build fixture and run Playwright Chromium/WebKit (real device separately) |
| React 19 and static vanilla without runtime collisions | **UNVERIFIED** | Run two-host fixture with shared `SiteDefinition`, test cleanup and node ownership |
| Keyboard-focus/ARIA/default route | **UNVERIFIED** | Browser events/focus/IME and mobile viewport tests |
| External-resource and policy safety | **UNVERIFIED** | Offline/self-host bundle, CSP, no third-party HTTP by default |

## 5. Actual bounded test-path evidence and recovery
- Isolated execution environment: `node v22.16.0`, `npm v10.9.2`, local `/usr/bin/chromium`, Python Playwright installed.
- `npm view @awesome.me/webawesome version --fetch-retries=0 --fetch-timeout=8000`: **FAILED EAI_AGAIN** DNS resolution of `registry.npmjs.org`. This establishes a **network/tool path failure, not incompatibility of Web Awesome**.
- Local platform baseline Chromium navigation to `file:///...` and `http://127.0.0.1:<port>/...`: both **FAILED net::ERR_BLOCKED_BY_ADMINISTRATOR**. No successful browser scenario or successful vendor integration was observed; do not claim PASS.
- **Recovery path:** run the same pinned dependency install and fixture in an approved GitHub-native CI or other already-authorized Node/browser environment with npm network + Chromium/WebKit. Keep a bounded dependency lockfile and capture versions/size/errors/footprint in this Issue. Do not use RDC or credential changes to bypass network policy.
- Distinguish `UNVERIFIED` from fail: pending use of a normal project workflow means no technical rejection of selected vendors. Native CI execution may depend on Actions free quota; verify allowable route before execution. Avoid automatic paid providers.

## 6. Next technical checks in strict order
1. Fix inaccurate initial description implying Web Awesome **Core Toast**; do not remove toast-like capability from requirements, only change its proposed provider.
2. Build **vanilla ESM + React/Vite** isolated fixture on pinned versions. Run page slot, burger/drawer focus, theme, breadcrumb with basePath, shortcut record/cancel/conflict/IME and cleanup; capture browser evidence and bundle graph.
3. Audit dependency trees and free/Pro boundary. Test alternative UI provider only if a hard failure or prohibitive size/styling collision is verified.
4. Converge with [M0 site inventory](M0_SITE_INVENTORY.md) for architecture gate. Keep M1 implementation blocked until M0 acceptance criteria or explicitly narrowed, recorded exceptions.

**Disposition: Issue #3 remains OPEN**. Package versions are research references, not accepted production pins. The site kit is not yet an installed/built/released library.
