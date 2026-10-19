# Modern website / Web App expected capabilities — evidence survey (2026-10-19)

Status: **RESEARCH / GAP ANALYSIS ONLY**. This report does not amend the accepted Site Kit contract, approve any new dependency, or certify legal/accessibility/security compliance. Canonical product spec: [SPECIFICATION.md](SPECIFICATION.md), owner [Site Kit #1](https://github.com/kinoko34077/kinotch-site-kit/issues/1), [M2 #5](https://github.com/kinoko34077/kinotch-site-kit/issues/5), [M3 #6/#7](https://github.com/kinoko34077/kinotch-site-kit/issues/6), [Verification #9](https://github.com/kinoko34077/kinotch-site-kit/issues/9), [roadmap #10](https://github.com/kinoko34077/kinotch-site-kit/issues/10). Investigated official guidance, standards, and industry UX heuristics as of Oct 19 2026. This is a source-evidence synthesis, not an independent hands-on audit of each named platform.

## R0. Evaluation conventions and critical distinction

- **BASE** = expected quality/behavior for virtually all public websites **if relevant content/interactivity exists**; not necessarily a visible widget or universal law.
- **STANDARD-OPTIONAL** = generally familiar capability for relevant content sites (site navigation, local/full search, help, theme, locale); must be explicitly enabled or omitted based on information architecture.
- **APP-TASK** = baseline **when users modify data or perform substantial tasks** (undo, reset, save status, recovery, import/export).
- **CONDITIONAL** = only when the product has a real need and legal/technical authority (auth, payments, analytics, consent, CMS, notifications, PWA, collaboration).
- **INFRA** = engineering quality and acceptance mechanisms rather than UI widgets.
- The word "modern" must **not** create a requirement for a cookie banner, a login wall, notifications, forced installation, a global header on an immersive app, or unsolicited analytics.
- Trace separately **source-supported principle**, **project-specific inference**, **currently implemented demo**, and **actual product acceptance**. Never mark CI fixture PASS as real iPhone physical-device PASS.

## R1. Baseline website requirements (BASE)

| Domain | Expected behavior/checklist | Acceptance evidence |
|---|---|---|
| Entry and purpose | Recognizable page/site purpose; concise title, one dominant primary task; no necessary controls buried beneath prose | 3-task first-use review; entry from direct deep link |
| Navigation | Link to main content; semantic header/nav/main/footer if present; consistent desktop/mobile menu, current location, back/forward and deep links; appropriate breadcrumbs for hierarchical sites | Keyboard + touch and navigation regression matrix |
| Responsive | 320px and typical mobile/tablet/desktop including landscape, safe areas, dynamic browser chrome; no sideways overflow or covered controls; zoom/reflow | 320/390/768/1024 CSS px, 200%-400% zoom checks |
| Accessibility | Proper heading ranks, landmarks, names/roles/values, link purpose, contrast, text alternatives, keyboard focus visible/not obscured; screenreader paths | WCAG 2.2 AA mapping and manual AT verification |
| Input options | Touch, pointer, keyboard; gestures always have accessible alternative; meaningful icon buttons have accessible name | Touch target and focus traversal/activation checks |
| Stability | Avoid layout shifts and stealing focus during render; no sudden full-screen modal for a routine status update | CLS measure, first paint/resize test, focus state |
| Loading/error/empty | Visible distinction between not loaded, loading, empty result, invalid input, network unavailable, permission denied, partial failure | State-transition matrix incl retry and fallback |
| Reliable navigation | True 404 HTTP status and recovery link, genuine status for unavailable/forbidden/error, known route support | Direct URL/refresh/unknown URL E2E |
| Forms (when used) | Persistent visible label, appropriate autocomplete/input modes, validation near field + summary when appropriate, preserve entered data | Error-and-correct tests, input retention, IME |
| Trust and transparency | Clear operator/help/contact where appropriate, accurate feature status; data collected only when necessary, no fabricated policies | App-owned facts, trace any network/data use |
| Performance | Small initial cost, avoid unnecessary modules/third-party calls; meaningful first paint and input latency; reserve media dimensions | Mobile field LCP/INP/CLS and per-feature bytes |
| Browser support | Browser feature support checked through Baseline and tested on supported engines; graceful enhancement | Chromium/Firefox/WebKit + iPhone Safari if available |
| Security | HTTPS, safe output encoding, no script/HTML injection, validated links, least privilege and secure headers under hosting control | OWASP ASVS/Top10 scoped threat-model checks |
| Structure/discoverability | Correct title/description and index/noindex, internal links; canonical/sitemap where real public content demands | Search Console / crawled HTML and no soft 404 |

W3C WCAG 2.2 AA **target size minimum**: 24×24 CSS px with allowed exceptions/spacing. This is **not** a universal "all buttons must be 44px" conformance rule. More comfortable touch sizing: web.dev guidance ~48 device-independent px; Apple platform guidance typical 44×44 pt for iOS default, different units/contexts. Set a larger **design goal**, and audit WCAG against its own criterion.

CWV web.dev "good" thresholds (real-user 75th percentile, segmented mobile/desktop): **LCP <=2.5 s**, **INP <=200 ms**, **CLS <=0.1**. These are measurement targets, not observed Site Kit performance. A lab browser screenshot or passing Playwright check does not prove them.

## R2. Common site components (STANDARD-OPTIONAL and task-aware)

| Capability | Where appropriate | Important behavior / avoidance |
|---|---|---|
| Logo/home, heading, header/footer | Ordinary content and product landing pages | Not mandatory fixed chrome on immersive editors |
| Responsive primary/secondary nav, hamburger | Multiple destinations/categories | PC must not lose nav just because mobile drawer is hidden; keyboard, Escape and focus return |
| Sidebars/tabs/tree/breadcrumbs | Rich hierarchy or multi-view tools | Current item/ARIA, no blank tab selection/hidden app content |
| Local vs full-site search | > a few pages, content-rich docs/catalog | Query -> result/zero state -> direct content, search scopes obvious, no hidden drafts |
| Help/FAQ/about/contact | Services/app complexity warrants support | Contextual help, owner-authored real information, consistent links |
| Theme, contrast, motion preferences | Useful especially editor/media/dark environments | System/light/dark **icon-only button can have accessible name**; no FOUC, preference persists, avoids overriding OS accessibility settings |
| Feedback/toasts/banners | Saving, network events, completion, failures | Truthful status, no covered controls, do not use toast as sole evidence of action outcome |
| Modal/disclosure/dialog | Only when user must decide or inspect details | Close via explicit control, Escape where applicable, focus trapping/return; use browser semantic primitives |
| Sort/filter/pagination/virtualize | Lists/catalogs/logs | Accessible clear/reset, URL/deep-linkable state where useful, no orphaned filter chips |
| Sharing/copy/download/print | Where content/data should leave the page | Clipboard failure fallback; share link not falsely expose private data |
| Feedback, onboarding, empty-state hints | New/complex tool | Short and contextual; not a permanent prose wall on every load |
| Media controls | Audio/video/image pages | Pause/stop, volume/scrub where applicable, captions/transcripts for media, user-triggered audio |
| Accessibility/user preferences | Reading-heavy or expert tools | Font/zoom/contrast/reduced motion should work; never solely color-code warnings |

## R3. Web App task guarantees (APP-TASK)

When users work on data, following guarantees outrank decorative features:

1. **Creation/open/import**: clear document or project open state; file permissions are user-initiated; supported formats and size errors explicit.
2. **Edit/apply feedback**: visible difference between value configured, value actually applied, and result ready; no speculative "saved" label.
3. **State retention**: browser back/forward, refresh, navigation, theme/menu opening and device rotate do not silently erase edits or input/selection where feasible.
4. **Save/autosave/draft**: indicate unsaved/saving/saved/error/conflict, restore prior committed version; asynchronous race and offline retry handled.
5. **Undo/Redo and Reset**: actionable undo for reversible operations; separate reset-to-default from revert-to-last-saved, version history if necessary.
6. **Error recovery**: ability to retry without starting from scratch; validation errors link to inputs; security/privilege failures fail closed only for affected action.
7. **Export/download/share**: accurately reflect file content/format, provenance, generation errors and security scope; no false completion before write success.
8. **Settings/presets**: clear active preset, customization origin and override precedence, compare before/after, reset and persist ownership.
9. **Interruptions**: network disconnect, tab background, canceled file picker, device low memory, partial initialization and interrupted saves gracefully handled.
10. **Interaction parity**: touch/pointer/keyboard accomplish required tasks; IME composition cannot trigger hotkeys unexpectedly; explicit alternative to gestures.
11. **Complex screens**: command palette / shortcuts list / adjustable panels / view mode / drag reordering only when complexity benefits; maintain focus order.
12. **Collaboration (CONDITIONAL)**: presence, permissions, conflict resolution, edit history and offline reconciliation only where shared docs actually exist.

Navigation and site shell by themselves do not satisfy Web App task guarantees. These usually require app-owned state/storage backends or domain-specific adapters; Site Kit should expose **hooks/contracts** and demonstrable fallback, not take ownership of each consumer's data.

## R4. Conditional modules (not blanket defaults)

| Category | Adopt only if... | Controls |
|---|---|---|
| Authentication/passkeys/MFA/session | Accounts/private data genuinely required | Security-owned identity provider; recovery, logout, reauthentication, roles; no homegrown auth in Site Kit |
| Privacy policy, cookie controls, consent management | Actual processing/telemetry and relevant jurisdiction require it | Accurate owner-reviewed content; clear choice and withdrawal; no fictitious "we do not track" claim |
| Payments/ecommerce | Transactions exist | Transaction review/confirmation, real receipt, tax/returns rules and fraud protection site-owned |
| PWA installation/service worker | Offline repeat use and app-like install are useful | Manifest, cache/version/upgrade/rollback, offline status, SW lifecycle safety; never install automatically |
| Push notifications | User benefit and explicit permission warrant interruptions | Default off and permission requested in context; accessible disable controls |
| i18n | Multiple language audiences | Full lang/dir, locale/fallback, local number/date, RTL, pluralization, locale route SEO, language selector |
| Site-wide search/Pagefind | Static content corpus and build indexing warrant it | Optional build hook, generated index, incremental rebuild, exclusion rules; dynamic app may need separate backend |
| OGP/structured data | Public share/search entities genuinely exist | Matching visible facts, indexability, accurate owner content, validate output, no spam |
| Analytics/error reporting | Explicit needs and data handling are authorized | Opt-in, minimization, retention, consent where applicable, no hidden external network |
| Comments/social/coediting | User workflows call for it | Moderation, antiabuse, visibility rules, audit trail and recovery |
| CMS / in-site editing | Content editors genuinely exist | Separate editor platform; capability-limited integration, no editor payload on public viewer pages |
| AI assistant/help | Task-specific demonstrable value, cost/security acceptable | Opt-in, user awareness, provenance, predictable failure/cost, no mandatory paid runtime dependency |

## R5. Site-type capability profiles (decision support)

| Site type | Core task | Distinct "expected" behaviors | Should not require |
|---|---|---|---|
| Portfolio/artist landing | Find work, listen/view and contact | Accessible media, share metadata, clear profile/contact and navigation, SEO where indexed | Account, consent modal without tracking, heavy PWA |
| Informational/docs | Find and understand information | Clear IA, table of contents, rich site search at scale, version and deep link, print/copy | Complex state store unless content editor |
| Media/interactive demo | Play, adjust, compare, export | Immediate response, accurate applied-state, A/B compare, reset, keyboard/touch parity, non-obscuring HUD | Permanent busy header, forced telemetry |
| Tools/audio editor | Open > transform > audition > compare > revert > export | Undo/history, robust file I/O, accurate actual audio state, presets, no lost work, processor-failure fallback | Content-marketing layout covering canvas |
| Game | Start > interact > pause > resume | Input modes, paused state, immersive layout, focus recovery, save when relevant | Mandatory breadcrumbs and footer in gameplay |
| Commerce/transaction | Select > review > pay > confirm | Real availability/fees, secure form, confirm, receipt, recovery | Silent background payment or guessed legal terms |
| Account/service dashboard | Monitor > edit > review > save | Auth/role, filtering, live/stale data states, safe changes, audit, account recovery | Public SEO indexing of private data |

## R6. Verification and engineering hygiene (INFRA)

- **Acceptance matrix**: user intent × device × browser × input mode × state (first load / loading / success / empty / invalid / offline / partial failure / retry / restored). Mark PASS/FAIL/UNVERIFIED/N/A, with test environment and evidence.
- **Accessibility**: automated axe/Lighthouse as a catch tool, not a substitute for screen reader and physical keyboard tests. Test zoom, reduced motion, contrast, mobile touch and real iPhone Safari separately.
- **Performance**: field CWV and lab waterfall/JS task long work, versioned bundle and image/font budgets, cold/hot loading, no hidden editor/analytics in simple pages.
- **Security and privacy**: OWASP Top10:2025 awareness and ASVS 5.0.0 appropriate verification, CSP/CORS/headers where host supports, input encoding, no unsafe DOM, appropriate auth ownership, trace actual third-party requests, no secrets in static artifacts.
- **Delivery**: reproducible locked dependencies, notices/SBOM, CI, isolated preview vs production, durable release notes/changelog, versioned package and compatibility matrix, staged rollback, observability with privacy controls.
- **Compatibility**: web.dev Baseline for web platform support, actual iOS Safari physical check, no-javascript/fallback tests where page can use them, back-forward cache, stale asset/cache consistency.
- **Evidence gaps**: automated Chromium/WebKit ≠ actual iPhone, simulated touch ≠ hand use, performance assertion ≠ field CWV, text-only legal page gate ≠ policy correctness, prototype navigation ≠ production shell acceptance.

## R7. Site Kit gap map against live repo (read 2026-10-19 main)

| Site Kit module | Evidence | Remaining uncertainty / recommendation |
|---|---|---|
| M0 browser pages, M1 Core/Vanilla/React | Merged #23/#24/#25 with native/TypeScript checks | Stable API, pinned independent ESM/CSS, SSR/static host support #4/#8 |
| Responsive demo shell + theme | #21/#22, Pages Chromium/WebKit | Production optional shell with semantic landmarks/profiles and real mobile focus/first paint #5/#9 |
| Action registry and keyboard | #28 rebind/conflict/input tests | Real IME composition/keyboard-layout/AT and general consumer routes #6/#9 |
| Standard pages/404 | #28/#29 opt-in authored pages, public HTTP 404 verified | Site-owned legal content, contact/help patterns and no-JS matrix #7/#9 |
| Metadata, sitemap generator | #29 | OGP/structured data and genuine build-time sitemap artifact; correct indexing strategy #7 |
| Search | #30 two-host local authored-page search; public CI 44/44 PASS | Pagefind full content index optional + content exclusions; not all-site search #7 |
| i18n | Spec calls out i18next but module not implemented | Site-owned locale packs, language/dir/RTL, persistent switching, lazy imports #7 |
| Performance and release | No published package or device acceptance | Full browser/physical iPhone/CWV, notices/license and stable delivery/rollback #9/#8 |
| Web App saved work/undo/files | Project defines lifecycle but does not own app data | Optional task-state interfaces and UI patterns, consumer-owned storage, transaction boundaries |

**Prioritization (research-derived proposal, not accepted product scope):**
- **P0 acceptance foundation**: production shell semantics/keyboard/mobile/focus, errors/recovery/empty/loading, correct save/applied states (when app edits), privacy/security, test matrix, reproducible releases.
- **P1 reusable components**: accessible navigation/optional breadcrumbs/theme; forms/feedback; opt-in help/about/404; keyboard action registry; route/SEO; offline local search and optional Pagefind/i18n when sites need them.
- **P2 specialized integrations**: offline PWA, push, account, collaborative editing, transactions, charts, command palette, CMS bridge, app-specific import/export/state hooks — only after consumer requirements justify them.

## R8. Verified reference library and learning sites

Primary normative / platform / official guidance (read current pages, not inferred from article titles):
1. [W3C WAI WCAG 2.2 new criteria](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) — focus, dragging alternatives, touch size, consistent help and accessible auth.
2. [W3C Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) — exact AA size/exception conditions.
3. [W3C Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum) — persistent header/HUD and focus.
4. [W3C WAI Page Structure](https://www.w3.org/WAI/tutorials/page-structure/) and [Menus](https://www.w3.org/WAI/tutorials/menus/structure/) — headings, landmarks, nav current state.
5. [Google web.dev Web Vitals](https://web.dev/articles/vitals) — LCP/INP/CLS and field thresholds.
6. [web.dev Baseline](https://web.dev/baseline) — interoperable feature availability and support age.
7. [MDN Performance Budgets](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Performance_budgets) — prevent regressions.
8. [OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/) and [OWASP Top 10:2025](https://top10.owasp.org/2025/ja/) — risk/requirements.
9. [OWASP HTTP Security Headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html) and [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — host-level protection.
10. [Google Search Central SEO Starter](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=ja), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=ja), [Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ja).
11. [W3C Internationalization Best Practices](https://www.w3.org/TR/international-specs/) — lang/dir/RTL/cross-locale considerations.
12. [MDN PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices) — offline/install/deep links as optional design.
13. [W3C Privacy Principles](https://www.w3.org/TR/privacy-principles/) and [Ethical Web Principles](https://www.w3.org/TR/ethical-web-principles/).

Design systems / instructional exemplars (patterns, not binding site policy):
14. [GOV.UK Design System Components](https://design-system.service.gov.uk/components/) and [Patterns](https://design-system.service.gov.uk/patterns/) — tested forms, states, skip links, error summaries and task flows.
15. [GOV.UK Error Messages](https://design-system.service.gov.uk/components/error-message/) and [Error Summary](https://design-system.service.gov.uk/components/error-summary/) — where and how to explain recovery.
16. [Nielsen Norman Group Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — status visibility, consistency, user control/undo, recognition and error recovery.
17. [Apple Human Interface Guidelines](https://developer.apple.com/jp/design/human-interface-guidelines) and [Apple Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) — touch, platform consistency and input options.
18. [MDN Native Dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) and [autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) — prefer interoperable primitives.
19. [web.dev back-forward cache](https://web.dev/articles/bfcache?hl=ja) and [MDN HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) — restore/state and asset version safety.
20. [Pagefind](https://pagefind.app/) and [i18next](https://www.i18next.com/) — candidate optional infrastructure already referenced in canonical spec; integration acceptance requires separate PoC/version/license verification.

## R9. Actionable next checks (not automatic implementation orders)

1. Attach a provenance-aware baseline checklist to quality Issue #9, not substitute it for future project-specific acceptance.
2. Pilot across representative vanilla/static + React contexts and distinguish site **purpose** from **technology stack**.
3. Validate task-oriented recovery (open/operate/result/compare/revert/export), not just button click smoke; gather real screenreader and physical iPhone evidence.
4. Add the missing production shell a11y/profile gate and metadata indexing truth before claiming M2/M3 complete.
5. Keep Pagefind/i18next/PWA/analytics/etc modular and absent from disabled builds. Benchmark actual import bytes and network requests.
6. Retain individual consumer/identity/editor ownership: shared Kit controls view semantics, not permission grants, business-specific file data, original music/audio processing, or user-approved legal text.
