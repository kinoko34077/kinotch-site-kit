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
  await expect(page.locator('#theme-icon')).toHaveText('☀️');
  await page.locator('#theme').click();
  await expect(page.locator('#theme')).toHaveAttribute('data-mode', 'dark');
  await expect(page.locator('#theme-icon')).toHaveText('🌙');
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
  await page.locator('#detail a[href="./react.html"]').click();
  await expect(page).toHaveTitle(/React/);
  await expect(page.locator('#react-count')).toHaveText('0');
  await page.locator('section.hero a[href="./"]').click();
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
    // Web Awesome updates its responsive "view" after a ResizeObserver cycle.
    // Measuring immediately after customElements.whenDefined can catch the pre-layout
    // desktop grid in WebKit (main starts at x=195px in a 320px viewport).
    // Gate the steady-state result without hiding the initial-layout observation.
    const initialView = await page.locator('#site-shell').getAttribute('view');
    await expect(page.locator('#site-shell')).toHaveAttribute('view', width < 760 ? 'mobile' : 'desktop');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    if (width === 320) console.log('M0_RESPONSIVE_VIEW', width, 'initial=', initialView, 'settled=', await page.locator('#site-shell').getAttribute('view'));
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth
    }));
    if (dimensions.documentWidth > width + 2) {
      const elements = await page.evaluate(() => {
        const offenders = [];
        function visit(root) {
          for (const el of root.querySelectorAll('*')) {
            const b = el.getBoundingClientRect();
            if (b.width > 0 && b.right > innerWidth + 1) {
              const style = getComputedStyle(el);
              offenders.push({
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                className: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
                left: Math.round(b.left), right: Math.round(b.right), width: Math.round(b.width),
                minWidth: style.minWidth, whiteSpace: style.whiteSpace, display: style.display
              });
            }
            if (el.shadowRoot) visit(el.shadowRoot);
          }
        }
        visit(document);
        return offenders.sort((a,b) => b.right - a.right).slice(0, 18);
      });
      const containers = await page.evaluate(() => ['html','body','wa-page','#main','.demo-grid','.demo-card','.demo-card .controls','#notify','#record'].map(selector => {
        const el = document.querySelector(selector);
        if (!el) return { selector, missing: true };
        const b = el.getBoundingClientRect();
        const c = getComputedStyle(el);
        return { selector, x: Math.round(b.left), width: Math.round(b.width), right: Math.round(b.right),
          cssMin: c.minWidth, cssMax: c.maxWidth, grid: c.gridTemplateColumns, overflow: c.overflowX };
      }));
      console.log('M0_OVERFLOW_CONTAINER', width, JSON.stringify(containers));
      console.log('M0_OVERFLOW_DIAGNOSTIC', width, JSON.stringify(elements));
    }
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

test('desktop menu opens with button and closes with Escape or outside click', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('./');
  await expect(page.locator('#site-shell')).toHaveAttribute('view', 'desktop');
  await expect(page.locator('#desktop-menu-toggle')).toBeVisible();
  await expect(page.locator('#toggle-nav')).toBeHidden();
  await expect(page.locator('#desktop-menu')).toBeHidden();
  await page.locator('#desktop-menu-toggle').click();
  await expect(page.locator('#desktop-menu')).toBeVisible();
  await expect(page.locator('#desktop-menu-toggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#desktop-menu a[href="#feature-status"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#desktop-menu')).toBeHidden();
  await expect(page.locator('#desktop-menu-toggle')).toBeFocused();
  await page.locator('#desktop-menu-toggle').click();
  await page.locator('#page-title').click();
  await expect(page.locator('#desktop-menu')).toBeHidden();
  await expect(page.locator('#desktop-menu-toggle')).toHaveAttribute('aria-expanded', 'false');
});

test('theme icon and accessible label change in place and restore preference', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#theme-icon')).toHaveText('🖥️');
  await expect(page.locator('#theme-label')).toHaveCount(0);
  await expect(page.locator('#theme')).toHaveAttribute('aria-label', /システム/);
  await page.locator('#theme').click();
  await expect(page.locator('#theme-icon')).toHaveText('☀️');
  await expect(page.locator('#theme-label')).toHaveCount(0);
  await page.locator('#theme').click();
  await expect(page.locator('#theme-icon')).toHaveText('🌙');
  await expect(page.locator('#theme-label')).toHaveCount(0);
  await expect(page.locator('#theme')).toHaveAttribute('aria-label', /ダーク/);
  await page.reload();
  await expect(page.locator('#theme-icon')).toHaveText('🌙');
  await page.locator('#theme').click();
  await expect(page.locator('#theme-icon')).toHaveText('🖥️');
});

test('preview presents tested features separately from planned product features', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#feature-status')).toContainText('試せる');
  await expect(page.locator('#feature-status')).toContainText('未実装');
  await expect(page.locator('#feature-status a[href*="/issues/10"]')).toBeVisible();
  await expect(page.locator('#menu-status')).toBeVisible();
});

test('M1 shared SiteDefinition generates the same route links in both hosts', async ({ page }) => {
  await page.goto('./');
  const vanilla = page.locator('#core-nav nav a');
  await expect(vanilla).toHaveCount(2);
  const a = await vanilla.evaluateAll(els => els.map(x => new URL(x.href).pathname));
  expect(a[0]).toMatch(/\/$/);
  expect(a[1]).toMatch(/\/react\.html$/);
  const definition = await page.evaluate(() => ({
    id: window.__m0.coreController.definition.id,
    basePath: window.__m0.coreController.definition.basePath
  }));
  expect(definition.id).toBe('site-kit-preview');
  await page.goto('./react.html');
  const react = page.locator('#core-react-nav a');
  await expect(react).toHaveCount(2);
  expect(await react.evaluateAll(els => els.map(x => new URL(x.href).pathname))).toEqual(a);
  await expect(page.locator('#core-react-breadcrumbs')).toContainText('Vanilla JS 版 › React 版');
  const definition2 = await page.evaluate(() => ({
    id: window.__m0ReactCore.definition.id,
    basePath: window.__m0ReactCore.definition.basePath
  }));
  expect(definition2).toEqual(definition);
});

test('React desktop menu and icon cycle remain functional after state updates', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('./react.html');
  await expect(page.locator('#react-shell')).toHaveAttribute('view', 'desktop');
  await page.locator('#react-desktop-menu-toggle').click();
  await expect(page.locator('#react-desktop-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#react-desktop-menu')).toBeHidden();
  await expect(page.locator('#react-desktop-menu-toggle')).toBeFocused();
  await expect(page.locator('#react-theme-icon')).toHaveText('🖥️');
  await expect(page.locator('#react-theme-label')).toHaveCount(0);
  await page.locator('#react-theme').click();
  await expect(page.locator('#react-theme-icon')).toHaveText('☀️');
  await page.locator('#react-text').fill('React に残る');
  await page.locator('#react-action').click();
  await expect(page.locator('#react-text')).toHaveValue('React に残る');
  await page.reload();
  await expect(page.locator('#react-theme-icon')).toHaveText('☀️');
});
