# Static ESM distribution proof (M4 #8, **not released**)

Run `npm install --prefix packages/runtime` and `npm install --prefix packages/features`, then `node packages/runtime/scripts/build-static-kit.mjs`. The read-only CI uses exact pinned versions in those dev dependencies, without publishing or deploying a package.

Output: `packages/runtime/artifacts/static-kit/manifest.json` with named, **content-hashed** ESM entries, sha256 checksums and raw/gzip/Brotli sizes; each emitted JS file is included in the ephemeral 14-day GitHub Actions artifact. Every named entry and vendor dependency must resolve inside the self-hosted artifact, with no bare module imports or third-party network.

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

**Scope still OPEN:** stable versioned npm package, .d.mts declaration relocation/import path rewrite, CSS/icon licenses/attribution, standalone browser HTML served by a real non-React build system, SSR/hydration, physical iPhone/IME and an authorized site migration. See Issue #8, #9 and #10.
