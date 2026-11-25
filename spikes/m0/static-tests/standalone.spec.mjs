import {test,expect} from '@playwright/test';

test('no-bundler static consumer loads hashed Core/Vanilla and optional UI only on demand', async({page},testInfo)=>{
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>requests.push({url:r.url(),type:r.resourceType()}));
  const response=await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page.locator('#mount-status')).toHaveText('独立HTMLで初期化完了');
  const manifest=await page.evaluate(()=>window.__staticFixture.manifest);
  expect(manifest.isRelease).toBe(false);
  expect(Object.keys(manifest.entries)).toHaveLength(12);
  expect(manifest.files.filter(f=>f.path.endsWith('.js'))).toHaveLength(14);
  expect(Object.keys(manifest.types)).toHaveLength(12);
  expect(Object.keys(manifest.types).sort()).toEqual(Object.keys(manifest.entries).sort());
  for (const file of Object.values(manifest.types)) {
    expect(file.endsWith('.d.ts')).toBe(true);
    expect(manifest.files.some(item=>item.path===file)).toBe(true);
  }
  expect(manifest.files.filter(f=>f.kind==='types')).toHaveLength(12);
  expect(manifest.files.every(f=>/^[0-9a-f]{64}$/.test(f.sha256))).toBe(true);
  await expect(page.locator('#navigation nav a')).toHaveCount(2);
  await expect(page.locator('#navigation nav a[aria-current="page"]')).toHaveText('ホーム');
  await expect(page.locator('#navigation nav a').nth(1)).toHaveAttribute('href','/probe/help');
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('#language')).toBeDisabled();
  await expect(page.locator('#translation')).toHaveText('翻訳は未読込');
  const preClick=requests.map(x=>new URL(x.url).pathname);
  expect(preClick.filter(p=>p.includes(manifest.entries.i18n))).toEqual([]);
  expect(preClick.filter(p=>p.includes(manifest.entries['offline-cache']))).toEqual([]);
  expect(preClick.every(p=>p.startsWith('/probe/'))).toBe(true);
  const coreModulePath='/probe/kit/'+manifest.entries.core;
  expect(preClick).toContain(coreModulePath);
  await page.locator('#history').click();
  await expect(page.locator('#history-output')).toHaveText('Undo 0');
  await page.locator('#locale').click();
  await expect(page.locator('#language')).toBeEnabled();
  await expect(page.locator('#translation')).toHaveText('こんにちは');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#translation')).toHaveText('Hello');
  expect(requests.filter(x=>x.url.includes(manifest.entries.i18n)).length).toBeGreaterThan(0);
  expect(requests.every(x=>new URL(x.url).origin==='http://127.0.0.1:4183')).toBe(true);
  await page.locator('#dispose').click();
  await expect(page.locator('#navigation')).toBeEmpty();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('#mount-status')).toHaveText('共通ナビゲーションを解除済み');
  expect(errors).toEqual([]);
  await testInfo.attach('independent-static-network-'+testInfo.project.name,{
    body:Buffer.from(JSON.stringify({browser:testInfo.project.name,requests},null,2)),
    contentType:'application/json'
  });
});

test('self-hosted fixture fails closed on missing paths, forbids escaping artifact root',async({request})=>{
  const missing=await request.get('./not-a-route');
  expect(missing.status()).toBe(404);
  const escape=await request.get('./kit/../../../../etc/passwd');
  expect(escape.status()).toBe(404);
});

test('explicit offline-cache entry isolates real browser CacheStorage and retains last good',async({page})=>{
  await page.goto('./');
  await expect(page.locator('#mount-status')).toHaveText('独立HTMLで初期化完了');
  const result=await page.evaluate(async()=>{
    const manifest=window.__staticFixture.manifest;
    const {createPublicAssetCache}=await import(new URL('./kit/'+manifest.entries['offline-cache'],location.href));
    const scope=new URL('./',location.href).href, url=new URL('index.html',scope).href;
    let failure=false;
    const options={scope,appId:'static-offline-fixture',version:'v2',assets:['index.html'],
      fetcher:async()=>failure?new Response('unavailable',{status:503}):
        new Response('GOOD',{headers:{vary:'Accept-Encoding'}})};
    const own=createPublicAssetCache(options);
    const other=createPublicAssetCache({...options,appId:'static-offline-other'});
    const old=createPublicAssetCache({...options,version:'v1'});
    try {
      await (await caches.open(other.cacheName)).put(url,new Response('OTHER'));
      await (await caches.open(old.cacheName)).put(url,new Response('OLD'));
      const fresh=await (await own.handle(new Request(url))).text();
      failure=true;
      const fallback=await (await own.handle(new Request(url))).text();
      const cached=await (await own.handle(new Request(url),'cache-first')).text();
      const outOfScope=own.handle(new Request(new URL('../other/index.html',scope)))===null;
      await own.removeVersion('v1');
      const names=await caches.keys();
      return {fresh,fallback,cached,outOfScope,oldRemoved:!names.includes(old.cacheName),
        otherPreserved:names.includes(other.cacheName),ownPreserved:names.includes(own.cacheName)};
    } finally {
      await Promise.all([own,other,old].map(x=>caches.delete(x.cacheName)));
    }
  });
  expect(result).toEqual({fresh:'GOOD',fallback:'GOOD',cached:'GOOD',outOfScope:true,
    oldRemoved:true,otherPreserved:true,ownPreserved:true});
});
