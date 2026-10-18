// M0 demonstration only — site shell/vendor evaluation, not reusable Site Kit API.
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './demo.css';
import '@awesome.me/webawesome/dist/components/page/page.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/toast/toast.js';
import { HotkeyRecorder } from '@tanstack/hotkeys';

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
function dispose() {
  if (state.disposed) return;
  state.disposed = true;
  recorder.destroy();
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
window.__m0 = { state, shell, dispose };
window.addEventListener('pagehide', dispose, { once: true });
