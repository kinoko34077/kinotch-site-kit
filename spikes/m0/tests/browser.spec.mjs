import { test, expect } from '@playwright/test';

test('vanilla: Core Web Components are registered, theme and hotkey recorder work', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.evaluate(async () => Promise.all(['wa-page','wa-breadcrumb','wa-breadcrumb-item','wa-toast'].map(tag => customElements.whenDefined(tag))));
  await expect(page.locator('wa-page')).toBeVisible();
  await expect(page.locator('#site-shell')).toHaveAttribute('view', 'mobile');
  await page.locator('#toggle-nav').click();
  await expect(page.locator('#site-shell')).toHaveAttribute('nav-open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('#site-shell')).not.toHaveAttribute('nav-open', '');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('wa-breadcrumb-item')).toHaveCount(2);
  await page.locator('#theme').click();
  await expect(page.locator('#theme')).toHaveAttribute('data-mode', 'light');
  await page.locator('#theme').click();
  await expect(page.locator('#theme')).toHaveAttribute('data-mode', 'dark');
  await page.locator('#notify').click();
  await expect(page.locator('wa-toast-item')).toHaveCount(1);
  await page.locator('#record').click();
  await page.keyboard.press('Control+Alt+Shift+B');
  await expect(page.locator('#recorded')).not.toHaveText('未割当');
  await page.evaluate(() => window.__m0.dispose());
  await expect.poll(() => page.evaluate(() => window.__m0.state.disposed)).toBe(true);
  expect(errors).toEqual([]);
});

test('React: custom elements coexist with host-owned state and recorder', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./react.html');
  await page.evaluate(async () => customElements.whenDefined('wa-page'));
  await expect(page.locator('#react-shell')).toHaveAttribute('view', 'mobile');
  await expect(page.locator('#react-count')).toHaveText('0');
  await page.locator('#react-action').click();
  await expect(page.locator('#react-count')).toHaveText('1');
  await expect(page.locator('#react-text')).toHaveValue('unchanged');
  await page.locator('#react-record').click();
  await page.keyboard.press('Control+Alt+Shift+B');
  await expect(page.locator('#react-recorded')).not.toHaveText('未割当');
  await page.evaluate(() => window.__m0ReactDispose());
  await expect(page.locator('#react-host')).toBeEmpty();
  expect(errors).toEqual([]);
});

test('preview navigation works and React page has a return path', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle(/Vanilla JS/);
  await page.locator('section.hero a[href="./react.html"]').click();
  await expect(page).toHaveTitle(/React/);
  await expect(page.locator('#react-count')).toHaveText('0');
  await page.locator('a[href="./"]').first().click();
  await expect(page).toHaveTitle(/Vanilla JS/);
});

test('editing text survives menu + theme and theme preference survives reload', async ({ page }) => {
  await page.goto('./');
  await page.locator('#editor').fill('任意の入力が保持される');
  await page.locator('#toggle-nav').click();
  await page.keyboard.press('Escape');
  await page.locator('#theme').click();
  await expect(page.locator('#editor')).toHaveValue('任意の入力が保持される');
  await expect(page.locator('#theme')).toHaveAttribute('data-mode', 'light');
  await page.reload();
  await expect(page.locator('#theme')).toHaveAttribute('data-mode', 'light');
  await expect(page.locator('#theme-status')).toHaveText('ライト');
});

test('keyboard Escape closes menu without hijacking editable input', async ({ page }) => {
  await page.goto('./');
  await page.locator('#editor').fill('keyboard test');
  await page.locator('#editor').press('Control+Alt+Shift+B');
  await expect(page.locator('#recorded')).toHaveText('未割当');
  await expect(page.locator('#editor')).toHaveValue('keyboard test');
  await page.locator('#toggle-nav').click();
  await expect(page.locator('#site-shell')).toHaveAttribute('nav-open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('#site-shell')).not.toHaveAttribute('nav-open', '');
});

test('narrow and desktop viewport remain usable without horizontal overflow', async ({ page }) => {
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto('./');
    await page.evaluate(async () => customElements.whenDefined('wa-page'));
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    }));
    expect(dimensions.documentWidth, 'document overflow at ' + width).toBeLessThanOrEqual(width + 2);
    expect(dimensions.bodyWidth, 'body overflow at ' + width).toBeLessThanOrEqual(width + 2);
    await expect(page.locator('#notify')).toBeVisible();
    await expect(page.locator('#theme')).toBeVisible();
  }
});

test('preview loads without unexpected third-party assets or telemetry calls', async ({ page }) => {
  const unexpected = [];
  const ignored = new Set(['document']);
  page.on('request', request => {
    if (ignored.has(request.resourceType())) return;
    const requestOrigin = new URL(request.url()).origin;
    const pageOrigin = new URL(page.url()).origin;
    if (requestOrigin !== pageOrigin) unexpected.push({ type: request.resourceType(), url: request.url() });
  });
  await page.goto('./');
  await page.evaluate(async () => customElements.whenDefined('wa-toast'));
  await page.locator('#notify').click();
  await page.locator('#theme').click();
  expect(unexpected).toEqual([]);
});

test('React reset keeps typed text and semantic landmarks', async ({ page }) => {
  await page.goto('./react.html');
  await page.locator('#react-text').fill('保持したい文字');
  await page.locator('#react-action').click();
  await page.locator('#react-action').click();
  await expect(page.locator('#react-count')).toHaveText('2');
  await page.locator('#react-reset').click();
  await expect(page.locator('#react-count')).toHaveText('0');
  await expect(page.locator('#react-text')).toHaveValue('保持したい文字');
  await expect(page.locator('header[slot="header"]')).toHaveCount(1);
  await expect(page.locator('nav[slot="navigation"]')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer[slot="footer"]')).toHaveCount(1);
});

test('simulated touch can open mobile menu and switch theme', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  try {
    const page = await context.newPage();
    await page.goto('./');
    await page.evaluate(async () => customElements.whenDefined('wa-page'));
    await page.locator('#toggle-nav').tap();
    await expect(page.locator('#site-shell')).toHaveAttribute('nav-open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-shell')).not.toHaveAttribute('nav-open', '');
    await page.locator('#theme').tap();
    await expect(page.locator('#theme')).toHaveAttribute('data-mode', 'light');
  } finally {
    await context.close();
  }
});
