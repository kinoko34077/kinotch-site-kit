// M0 composition probe; not production Site Kit code.
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@awesome.me/webawesome/dist/components/page/page.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/toast/toast.js';
import { HotkeyRecorder } from '@tanstack/hotkeys';

const shell = document.getElementById('site-shell');
const themeButton = document.getElementById('theme');
const recordButton = document.getElementById('record');
const result = document.getElementById('recorded');
const notification = document.getElementById('notices');
const state = { theme: 'system', disposed: false, notices: 0 };
const options = ['system', 'light', 'dark'];
const recorder = new HotkeyRecorder({
  onRecord: (hotkey) => { result.textContent = String(hotkey); },
  onCancel: () => { result.textContent = 'キャンセル'; }
});
function onTheme() {
  state.theme = options[(options.indexOf(state.theme) + 1) % options.length];
  document.documentElement.style.colorScheme = state.theme === 'system' ? '' : state.theme;
  themeButton.dataset.mode = state.theme;
}
function onNotify() {
  state.notices += 1;
  notification.create('通知 ' + state.notices);
}
function onRecord() { recorder.start(); }
themeButton.addEventListener('click', onTheme);
document.getElementById('notify').addEventListener('click', onNotify);
recordButton.addEventListener('click', onRecord);
function dispose() {
  if (state.disposed) return;
  state.disposed = true;
  recorder.destroy();
  themeButton.removeEventListener('click', onTheme);
  recordButton.removeEventListener('click', onRecord);
  document.getElementById('notify').removeEventListener('click', onNotify);
}
window.__m0 = { state, shell, dispose };
window.addEventListener('pagehide', dispose, { once: true });
