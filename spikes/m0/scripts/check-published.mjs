// Public deployment smoke check. No auth tokens or writing to external services.
import { strict as assert } from 'node:assert';
const base = process.env.SITE_URL;
if (!base || !/^https:\/\//.test(base)) throw new Error('SITE_URL must be an HTTPS deployment URL');
const root = new URL(base.endsWith('/') ? base : base + '/');
const expected = '/kinotch-site-kit/';
assert.equal(root.pathname, expected, 'Unexpected Pages base path');
const paths = ['', 'react.html'];
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function retry(url, attempts = 16) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await fetch(url, { headers: { 'User-Agent': 'SiteKit-Pages-Smoke/1.0' }, redirect: 'follow' });
      if (!result.ok) throw new Error('HTTP ' + result.status);
      return result;
    } catch (err) {
      last = err;
      if (i < attempts - 1) await sleep(5000);
    }
  }
  throw new Error('Published URL could not be verified: ' + url + ' -> ' + last?.message);
}
for (const path of paths) {
  const pageURL = new URL(path, root);
  const response = await retry(pageURL);
  const html = await response.text();
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /Site Kit.*(?:Vanilla JS|React)/);
  const assetLinks = [];
  for (const m of html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"[^>]*>/g)) {
    const original = m[1];
    if (/^(?:https?:)?\/\//.test(original)) throw new Error('External asset in public HTML: ' + original);
    const assetURL = new URL(original, pageURL);
    assert.equal(assetURL.origin, root.origin);
    assert.ok(assetURL.pathname.startsWith(root.pathname), 'Asset escapes repository path: ' + assetURL.href);
    assetLinks.push(assetURL);
  }
  assert.ok(assetLinks.some(x => x.pathname.includes('/assets/') && x.pathname.endsWith('.js')), 'No built JS asset in ' + path);
  assert.ok(assetLinks.some(x => x.pathname.includes('/assets/') && x.pathname.endsWith('.css')), 'No built CSS asset in ' + path);
  for (const asset of assetLinks) {
    const res = await retry(asset, 4);
    const text = await res.text();
    assert.ok(text.length > 20, 'Empty asset ' + asset);
  }
  console.log('PUBLIC PASS', response.status, pageURL.href, 'local_assets=', assetLinks.length);
}
