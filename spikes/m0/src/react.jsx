// React host ownership / vendor composition probe. NOT production Site Kit code.
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useHotkeyRecorder } from '@tanstack/react-hotkeys';
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './demo.css';
import '@awesome.me/webawesome/dist/components/page/page.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/toast/toast.js';

function Fixture() {
  const [count, setCount] = useState(0);
  const [recorded, setRecorded] = useState('未割当');
  const recorder = useHotkeyRecorder({
    onRecord: value => setRecorded(String(value)),
    onCancel: () => setRecorded('キャンセル')
  });
  useEffect(() => {
    window.__m0ReactMounted = true;
    return () => { window.__m0ReactMounted = false; };
  }, []);
  return <wa-page id="react-shell" mobile-breakpoint="760">
    <header slot="header" className="demo-header">
      <span className="brand">KiNoTch. / Site Kit <span className="tag">React 検証版</span></span>
      <div className="header-actions"><wa-button data-toggle-nav size="small">☰ メニュー</wa-button>
        <a href="./">Vanilla版へ戻る</a></div>
    </header>
    <nav slot="navigation" className="demo-nav" aria-label="検証ページ一覧">
      <a href="./">Vanilla JS 版</a><a href="./react.html" aria-current="page">React 版</a>
      <a href="https://github.com/kinoko34077/kinotch-site-kit/issues/16">検証Issue ↗</a>
    </nav>
    <main id="main" className="demo-main">
      <wa-breadcrumb><wa-breadcrumb-item href="./">Site Kit</wa-breadcrumb-item><wa-breadcrumb-item>React</wa-breadcrumb-item></wa-breadcrumb>
      <section className="hero">
        <p className="eyebrow">REACT 19 + WEB COMPONENTS</p>
        <h1>Reactの状態管理を維持したまま、共通UIを組み込む。</h1>
        <p>操作中の値や入力欄の内容を維持し、Web Componentsを同居させるための技術検証ページです。</p>
        <p><a href="./">Vanilla JSの検証画面へ →</a></p>
      </section>
      <div className="demo-grid">
        <section className="demo-card">
          <h2>01 — React管理のカウンター</h2>
          <p>ボタンを操作しても入力内容と他の部品を再生成せずに状態が変わります。</p>
          <div className="controls">
            <button id="react-action" type="button" onClick={() => setCount(n => n + 1)}>1 増やす</button>
            <button id="react-reset" type="button" onClick={() => setCount(0)}>0 に戻す</button>
          </div>
          <output id="react-count" className="demo-output" data-count={count} aria-live="polite">{count}</output>
        </section>
        <section className="demo-card">
          <h2>02 — キーの組合せを記録</h2>
          <p>React側のライフサイクルでレコーダーを管理します。</p>
          <div className="controls"><button id="react-record" type="button" onClick={() => { setRecorded('記録中…'); recorder.startRecording(); }}>記録開始</button></div>
          <output id="react-recorded" className="demo-output" aria-live="polite">{recorded}</output>
        </section>
        <section className="demo-card">
          <h2>03 — 入力欄の状態保持</h2>
          <p>入力後にカウンターを押し、文字が消えないか確認できます。</p>
          <label htmlFor="react-text">自由入力</label>
          <input id="react-text" defaultValue="unchanged"/>
        </section>
      </div>
      <p className="demo-note">React版もM0技術試作であり、本体の共通APIや実サービスではありません。入力した内容は送信しません。</p>
    </main>
    <footer slot="footer" className="demo-footer">
      KiNoTch. Site Kit / React M0 Preview <a href="./">Vanilla版</a>
      <a href="https://github.com/kinoko34077/kinotch-site-kit">GitHub</a>
    </footer>
  </wa-page>;
}
const root = createRoot(document.getElementById('react-host'));
root.render(<Fixture/>);
window.__m0ReactDispose = () => root.unmount();
