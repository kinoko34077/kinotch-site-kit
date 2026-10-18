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
