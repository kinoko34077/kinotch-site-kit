# KiNoTch. Site Kit

Reusable and configurable Website/Application Shell + standard feature kit for KiNoTch.'s heterogeneous public websites. **Initial spec/bootstrap only**; no library implementation, consumer migration, release or deployment has been accepted yet.

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
The initial repository is **private by safe devflow default** because no public visibility choice was established for this new repository; visibility/credentials/releases/deploy require separate authorization. No license guessed. Creation via trusted devflow repository-bootstrap.v1 only.
Representative consumers checked before bootstrap: microtone-piano, Gomoku-5D, frequency-warp-vst/web-demo, tarot-draw, lyric_reader_page, line-style-viewer. No consumer was changed.
