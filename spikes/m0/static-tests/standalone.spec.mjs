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
  expect(Object.keys(manifest.entries)).toHaveLength(11);
  expect(manifest.files.filter(f=>f.path.endsWith('.js'))).toHaveLength(13);
  expect(Object.keys(manifest.types)).toHaveLength(11);
  expect(Object.keys(manifest.types).sort()).toEqual(Object.keys(manifest.entries).sort());
  for (const file of Object.values(manifest.types)) {
    expect(file).toMatch(/\\.d\\.ts$/);
    expect(manifest.files.some(item=>item.path===file)).toBe(true);
  }
  expect(manifest.files.filter(f=>f.kind==='types')).toHaveLength(11);
  expect(manifest.files.every(f=>/^[0-9a-f]{64}$/.test(f.sha256))).toBe(true);
  await expect(page.locator('#navigation nav a')).toHaveCount(2);
  await expect(page.locator('#navigation nav a[aria-current="page"]')).toHaveText('ホーム');
  await expect(page.locator('#navigation nav a').nth(1)).toHaveAttribute('href','/probe/help');
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('#language')).toBeDisabled();
  await expect(page.locator('#translation')).toHaveText('翻訳は未読込');
  const preClick=requests.map(x=>new URL(x.url).pathname);
  expect(preClick.filter(p=>p.includes(manifest.entries.i18n))).toEqual([]);
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
