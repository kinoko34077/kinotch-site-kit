// M0 demonstration only — site shell/vendor evaluation, not reusable Site Kit API.
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './demo.css';
import '@awesome.me/webawesome/dist/components/page/page.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/toast/toast.js';
import { HotkeyRecorder } from '@tanstack/hotkeys';
import { createSiteController } from '../../../packages/core/index.mjs';
import { createVanillaNavigationAdapter } from '../../../packages/adapters/vanilla.mjs';
import { siteInputForPath } from './site-contract.js';
import { createPageMetadata, applyPageMetadata } from '../../../packages/features/seo.mjs';
import { createActionRegistry } from '../../../packages/features/actions.mjs';
import { createFeatureCatalog } from '../../../packages/runtime/catalog.mjs';
import { searchIndexFromPages } from '../../../packages/features/search.mjs';
import { previewPageRegistry, PREVIEW_SHORTCUTS, PREVIEW_LOCALE_RESOURCES } from './feature-demo.js';

const shell = document.getElementById('site-shell');
const themeButton = document.getElementById('theme');
const themeIcon = document.getElementById('theme-icon');
const desktopButton = document.getElementById('desktop-menu-toggle');
const desktopMenu = document.getElementById('desktop-menu');
const menuStatus = document.getElementById('menu-status');
const recordButton = document.getElementById('record');
const result = document.getElementById('recorded');
const notification = document.getElementById('notices');
const noticeButton = document.getElementById('notify');
const themeStatus = document.getElementById('theme-status');
const noticeStatus = document.getElementById('notice-count');
const storageKey = 'kinotch-site-kit-m0-demo-theme';
const modes = ['system', 'light', 'dark'];
const labels = { system: 'システム', light: 'ライト', dark: 'ダーク' };
const icons = { system: '🖥️', light: '☀️', dark: '🌙' };
let restored = 'system';
try {
  const saved = localStorage.getItem(storageKey);
  if (modes.includes(saved)) restored = saved;
} catch { /* demo works without storage */ }
const state = { theme: restored, disposed: false, notices: 0 };
function applyTheme() {
  document.documentElement.dataset.demoTheme = state.theme === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : state.theme;
  themeButton.dataset.mode = state.theme;
  themeIcon.textContent = icons[state.theme];
  themeButton.setAttribute('aria-label', '現在 ' + labels[state.theme] + '。押すと表示モードを切替');
  themeButton.setAttribute('title', '現在: ' + labels[state.theme]);
  themeStatus.textContent = labels[state.theme];
}
const onSystemThemeChange = () => { if (state.theme === 'system') applyTheme(); };
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
systemTheme.addEventListener?.('change', onSystemThemeChange);
function onTheme() {
  state.theme = modes[(modes.indexOf(state.theme) + 1) % modes.length];
  applyTheme();
  try { localStorage.setItem(storageKey, state.theme); } catch { /* storage optional */ }
}
function onNotify() {
  state.notices += 1;
  notification.create('動作確認: 通知 ' + state.notices);
  noticeStatus.textContent = state.notices + ' 回通知しました';
}
const recorder = new HotkeyRecorder({
  onRecord: hotkey => { result.textContent = String(hotkey); },
  onCancel: () => { result.textContent = '記録をキャンセルしました'; }
});
function onRecord() { result.textContent = '記録中… キーを入力してください'; recorder.start(); }
function setDesktopMenu(open, restoreFocus = false) {
  desktopMenu.hidden = !open;
  desktopButton.setAttribute('aria-expanded', String(open));
  menuStatus.textContent = open ? 'PCのメニューを表示中。項目を選ぶか、Escapeで閉じます' : 'PCのメニューを閉じました';
  if (!open && restoreFocus) desktopButton.focus();
}
function onDesktopClick() { setDesktopMenu(desktopMenu.hidden); }
function onOutsideClick(event) {
  if (!desktopMenu.hidden && !desktopMenu.contains(event.target) && !desktopButton.contains(event.target)) setDesktopMenu(false);
}
function onDesktopKey(event) {
  if (event.key === 'Escape' && !desktopMenu.hidden) {
    event.preventDefault();
    setDesktopMenu(false, true);
  }
}
function onDesktopLink(event) {
  if (event.target.closest('a')) setDesktopMenu(false);
}
function onViewChanged() {
  if (shell.getAttribute('view') === 'mobile') {
    setDesktopMenu(false);
    menuStatus.textContent = 'スマホ：上の☰で横からメニューが開きます';
  } else if (desktopMenu.hidden) {
    menuStatus.textContent = 'PC：上の☰でメニュー一覧が開きます';
  }
}
const viewObserver = new MutationObserver(onViewChanged);
viewObserver.observe(shell, { attributes: true, attributeFilter: ['view'] });
themeButton.addEventListener('click', onTheme);
noticeButton.addEventListener('click', onNotify);
recordButton.addEventListener('click', onRecord);
desktopButton.addEventListener('click', onDesktopClick);
desktopMenu.addEventListener('click', onDesktopLink);
document.addEventListener('pointerdown', onOutsideClick);
document.addEventListener('keydown', onDesktopKey);
applyTheme();
onViewChanged();
// This separate, vendor-free controller owns only its dedicated demo navigation host.
const coreController = createSiteController(siteInputForPath(location.pathname));
coreController.mount(document.getElementById('core-nav'), createVanillaNavigationAdapter({ currentRouteId: 'home' }));
const restoreSeo = applyPageMetadata(document, createPageMetadata(coreController.definition, {
  origin: 'https://kinoko34077.github.io',routeId:'home',
  description:'KiNoTch. Site Kitの公開機能検証。標準ナビゲーション、テーマ、ヘルプとショートカットを操作できます。'
}));
// M3 experimental composition: opt-in authored pages + host-owned action registry.
const pages = previewPageRegistry();
const pageNav = document.getElementById('std-page-nav');
const pageTitle = document.getElementById('std-page-title');
const pageContent = document.getElementById('std-page-content');
const shortcutStatus = document.getElementById('shortcut-status');
const shortcutInput = document.getElementById('shortcut-input');
const shortcutEvents = new AbortController();
function openSamplePage(id) {
  const page = pages.renderText(id); // Will fail closed if disabled/missing legal content.
  pageTitle.textContent = page.title;
  pageContent.textContent = page.text; // text-only; no config HTML injection.
  for (const button of pageNav.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.page === id));
  }
}
for (const item of pages.links()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = item.title;
  button.dataset.page = item.id;
  button.addEventListener('click', () => openSamplePage(item.id), { signal: shortcutEvents.signal });
  pageNav.append(button);
  // The same enabled page registry controls header, drawer and footer discovery.
  for (const container of [desktopMenu, document.querySelector('.demo-nav'),
    document.getElementById('standard-footer-links')]) {
    const link = document.createElement('a');
    link.href = '#quick-pages';
    link.textContent = item.title + '（見本）';
    link.dataset.standardPage = item.id;
    link.addEventListener('click', () => openSamplePage(item.id), { signal: shortcutEvents.signal });
    container.append(link);
  }
}
openSamplePage('help');

const localSearch = searchIndexFromPages(pages);
const searchInput = document.getElementById('local-search-query');
const searchStatus = document.getElementById('local-search-status');
const searchResults = document.getElementById('local-search-results');
function updateLocalSearch() {
  searchResults.replaceChildren();
  const q = searchInput.value;
  if (!q.trim()) { searchStatus.textContent = 'キーワードを入力すると結果が表示されます'; return; }
  const results = localSearch.query(q);
  searchStatus.textContent = results.length ? results.length + ' 件見つかりました' : '該当するページはありません';
  for (const item of results) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.resultPage = item.id;
    const title = document.createElement('strong');
    title.textContent = item.title;
    const context = document.createElement('small');
    context.textContent = item.snippet;
    button.append(title,context); // text-only, never innerHTML.
    button.addEventListener('click', () => {
      openSamplePage(item.id);
      document.getElementById('quick-pages').scrollIntoView({block:'nearest',behavior:'auto'});
      pageTitle.focus();
    }, {signal:shortcutEvents.signal});
    searchResults.append(button);
  }
}
searchInput.addEventListener('input',updateLocalSearch,{signal:shortcutEvents.signal});

let shortcutFeedback = '';
const actions = createActionRegistry({
  target: document,
  storage: (() => { try { return localStorage; } catch { return undefined; } })(),
  storageKey: 'kinotch-site-kit-demo-shortcuts-v1',
  actions: [
    {id:'demo:notice',title:'通知を表示',defaultShortcut:PREVIEW_SHORTCUTS.notice,
      run() { noticeButton.click(); }},
    {id:'demo:help',title:'ヘルプを表示',defaultShortcut:PREVIEW_SHORTCUTS.help,
      run() { openSamplePage('help'); pageTitle.focus(); }}
  ],
  onChange: () => renderShortcutStatus()
});
function renderShortcutStatus() {
  const bindings = actions.list();
  const current = bindings.find(a => a.id === 'demo:notice').shortcut ?? '未設定';
  shortcutStatus.textContent = shortcutFeedback || ('通知: ' + current + ' / ヘルプ: ' + actions.get('demo:help'));
}
renderShortcutStatus();
function attemptBind() {
  try {
    shortcutFeedback = '';
    const current = actions.bind('demo:notice', shortcutInput.value);
    shortcutInput.value = current;
    renderShortcutStatus();
  } catch (error) {
    shortcutFeedback = error instanceof Error ? error.message : '設定に失敗しました';
    renderShortcutStatus();
  }
}
document.getElementById('shortcut-apply').addEventListener('click', attemptBind, { signal: shortcutEvents.signal });
document.getElementById('shortcut-clear').addEventListener('click', () => {
  actions.unbind('demo:notice'); shortcutFeedback = '通知のキー操作を解除しました';renderShortcutStatus();
}, { signal: shortcutEvents.signal });
document.getElementById('shortcut-reset').addEventListener('click', () => {
  actions.reset('demo:notice'); shortcutInput.value = actions.get('demo:notice');
  shortcutFeedback = '';renderShortcutStatus();
}, { signal: shortcutEvents.signal });
document.getElementById('shortcut-notice').addEventListener('click', () => actions.invoke('demo:notice'), { signal: shortcutEvents.signal });
document.getElementById('shortcut-help').addEventListener('click', () => actions.invoke('demo:help'), { signal: shortcutEvents.signal });

// Optional locale module is not fetched until the user explicitly enables it.
const localeCatalog = createFeatureCatalog();
const localeEnable = document.getElementById('locale-enable');
const localeSelect = document.getElementById('locale-select');
const localeMessage = document.getElementById('locale-message');
const localeSummary = document.getElementById('locale-summary');
let localeInstance = null;
let localeLoading = false;
function renderLocale() {
  if (!localeInstance) return;
  localeSelect.value = localeInstance.language;
  localeMessage.textContent = localeInstance.t('greeting');
  localeSummary.textContent = localeInstance.t('summary');
}
async function onLocaleEnable() {
  if (localeLoading || localeInstance || state.disposed) return;
  localeLoading = true;
  localeEnable.disabled = true;
  localeMessage.textContent = '多言語機能を読み込み中…';
  try {
    const {createLocalization} = await localeCatalog.load('i18n');
    if (state.disposed) return;
    const controller = await createLocalization({
      resources: PREVIEW_LOCALE_RESOURCES, language: 'ja', fallbackLanguage: 'ja'
    });
    if (state.disposed) { controller.dispose(); return; }
    localeInstance = controller;
    localeSelect.disabled = false;
    renderLocale();
  } catch {
    if (!state.disposed) {
      localeMessage.textContent = '読込に失敗しました。もう一度実行できます。';
      localeEnable.disabled = false;
    }
  } finally {
    localeLoading = false;
  }
}
async function onLocaleChange() {
  if (!localeInstance || state.disposed) return;
  try { await localeInstance.setLanguage(localeSelect.value); renderLocale(); }
  catch { localeMessage.textContent = '言語変更に失敗しました。'; }
}
localeEnable.addEventListener('click', onLocaleEnable, {signal: shortcutEvents.signal});
localeSelect.addEventListener('change', onLocaleChange, {signal: shortcutEvents.signal});

function dispose() {
  if (state.disposed) return;
  state.disposed = true;
  recorder.destroy();
  actions.dispose();
  localeInstance?.dispose();
  shortcutEvents.abort();
  restoreSeo();
  coreController.dispose();
  themeButton.removeEventListener('click', onTheme);
  noticeButton.removeEventListener('click', onNotify);
  recordButton.removeEventListener('click', onRecord);
  desktopButton.removeEventListener('click', onDesktopClick);
  desktopMenu.removeEventListener('click', onDesktopLink);
  document.removeEventListener('pointerdown', onOutsideClick);
  document.removeEventListener('keydown', onDesktopKey);
  viewObserver.disconnect();
  systemTheme.removeEventListener?.('change', onSystemThemeChange);
}
window.__m0 = { state, shell, coreController, actions, pages, localSearch, localeCatalog, dispose };
window.addEventListener('pagehide', dispose, { once: true });
