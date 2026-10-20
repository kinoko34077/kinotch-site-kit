# Static ESM distribution proof (M4 #8, **not released**)

Run `npm install --prefix packages/runtime` and `npm install --prefix packages/features`, then `node packages/runtime/scripts/build-static-kit.mjs`. The read-only CI uses exact pinned versions in those dev dependencies, without publishing or deploying a package.

Output: `packages/runtime/artifacts/static-kit/manifest.json` with named, **content-hashed** ESM entries, co-located `.d.ts` declarations for the 11 named entries, `manifest.types` lookup, sha256 checksums and raw/gzip/Brotli sizes; each emitted JS file is included in the ephemeral 14-day GitHub Actions artifact. Every named entry and vendor dependency must resolve inside the self-hosted artifact, with no bare module imports or third-party network.

A static host may copy **the entire manifest and all emitted files** into its own immutable, versioned asset directory and select an entry explicitly. This is a consumer-owned *future integration procedure*, not a change deployed to any existing consumer:

```js
// Example after a site owner has copied a reviewed/pinned artifact into /kit/vX/:
const manifest = await fetch('/kit/vX/manifest.json').then(r => {
  if (!r.ok) throw Error('Cannot load local Site Kit manifest');
  return r.json();
});
if (manifest.format !== 'kinotch-site-kit-static-proof.v1') throw Error('Unexpected Kit format');
const core = await import('/kit/vX/' + manifest.entries.core);
const kit = core.createSiteDefinition({
  id: 'example', name: 'Example', routes: [{id:'home',path:'/',title:'Home'}]
});
```

The example does **not** automatically validate artifact integrity against a trusted external digest, and dynamic imports do not become cryptographically signed because a manifest includes hashes. Production distribution must use site-owned allowlisted manifests/pinned commit or release digests, actual license/NOTICE/SBOM acceptance, security/compatibility review and a rollback strategy; no floating `latest`.

Smoke contracts run in Node against **built ESM output**, including core config, bounded history, verified save state and optional i18next activation. Runtime catalog's seven optional features remain behind dynamic imports; consumers do not have to import the runtime at all for just the core. No CSS is bundled here; site-owned theme styling and the separately evaluated Web Awesome theme remain a distinct optional asset/package.

## Independent no-framework browser consumer acceptance slice

CI now generates the static ESM artifact and serves a **separate plain HTML file** at `/probe/` using a minimal local Node HTTP server (`scripts/serve-static-fixture.mjs`). The fixture is not built or transformed by Vite, React or a site-specific bundler. The page fetches its same-origin immutable manifest and imports only hashed `core` and `vanilla-adapter` entrypoints at startup. The `history` feature loads after a pointer action, and the `runtime` + `i18n` adapter/vendor after a different explicit pointer action.

`spikes/m0/playwright.static.config.mjs` runs the fixture in **Chromium + desktop WebKit** and verifies root-relative `/probe/` links, semantic navigation, detached lifecycle, no cross-origin requests, no initial i18next fetch, subsequent translation, and genuine HTTP 404 for unknown paths. This is explicitly independent of the main demo's Vite-hosted public Pages tests. For a standalone run, build the artifact with the two local package dev-install steps above, run `npm install --prefix spikes/m0`, then `cd spikes/m0 && npx playwright test --config playwright.static.config.mjs` (Playwright engines must be installed).

Do not confuse this with actual full production static site admission: no CSS asset packaging, independently signed manifest, physical mobile Safari, static client pre/post hydration, or consumer-owned version pin/rollback has yet been accepted. It proves a narrowly-scoped **browser-native**, local, version-scoped, opt-in ESM adoption route.

**Scope still OPEN:** stable versioned npm package, .d.mts declaration relocation/import path rewrite, CSS/icon licenses/attribution, physical consumer deployment and SSR/hydration, physical iPhone/IME and an authorized site migration. See Issue #8, #9 and #10.

## Typed consumer proof (experimental)

The build now copies source `.d.mts` into sibling `.d.ts` files named for each hashed JavaScript entry, writes an artifact-local `package.json` with `type: module`, and rewrites relative Core type imports to the *actual* emitted Core filename. The manifest exposes `types` for 11 named entries; declarations do **not** require runtime React, Vite, or dynamic HTTP requests. The same build runs strict TypeScript 5.9.3 NodeNext compilation of a **new external consumer probe** that imports compiled Core, Vanilla/React adapters, SEO, history, operation, and i18n; expected-invalid type cases must be rejected.

Browser startup cost is still governed by emitted JavaScript modules, not the declaration files. The type filenames follow their paired JS entry for TypeScript resolution; per-file SHA-256 in the manifest identifies exact declaration content. To prevent stale type caches, pin and copy the **complete artifact by version**, not cherry-pick individual files. Do not treat this experimental proof as stable semantic-versioned npm publication or proof of browser support for every type consumer.
