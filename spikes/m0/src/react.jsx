// M0 React host ownership / custom element / recorder probe; not production code.
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useHotkeyRecorder } from '@tanstack/react-hotkeys';
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@awesome.me/webawesome/dist/components/page/page.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/toast/toast.js';

function Fixture() {
  const [count, setCount] = useState(0);
  const [recorded, setRecorded] = useState('未割当');
  const recorder = useHotkeyRecorder({
    onRecord: (value) => setRecorded(String(value)),
    onCancel: () => setRecorded('キャンセル')
  });
  useEffect(() => { window.__m0ReactMounted = true; return () => { window.__m0ReactMounted = false; }; }, []);
  return <wa-page id="react-shell" mobile-breakpoint="760">
    <header slot="header"><strong>React Site Kit fixture</strong> <wa-button data-toggle-nav size="small">メニュー</wa-button></header>
    <nav slot="navigation" aria-label="主ナビゲーション"><a href="#root">トップ</a></nav>
    <main id="main"><h1>React fixture</h1>
      <wa-breadcrumb><wa-breadcrumb-item href="#root">トップ</wa-breadcrumb-item><wa-breadcrumb-item>実験</wa-breadcrumb-item></wa-breadcrumb>
      <p>React state remains React-owned; no direct mutation from vendor adapter.</p>
      <input id="react-text" aria-label="React入力保持" defaultValue="unchanged"/>
      <button id="react-action" onClick={() => setCount(value => value + 1)}>React action</button>
      <output id="react-count" data-count={count}>{count}</output>
      <button id="react-record" onClick={() => recorder.startRecording()}>ショートカット記録</button>
      <output id="react-recorded" aria-live="polite">{recorded}</output>
    </main>
    <footer slot="footer">React host fixture</footer>
  </wa-page>;
}
const root = createRoot(document.getElementById('react-host'));
root.render(<Fixture/>);
window.__m0ReactDispose = () => root.unmount();
