// React host / Web Components compatibility preview. Not the finished shared Site Kit.
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useHotkeyRecorder } from '@tanstack/react-hotkeys';
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import './demo.css';
import '@awesome.me/webawesome/dist/components/page/page.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/toast/toast.js';

const MODES = ['system', 'light', 'dark'];
const LABELS = { system: 'システム', light: 'ライト', dark: 'ダーク' };
const ICONS = { system: '🖥️', light: '☀️', dark: '🌙' };
const STORAGE_KEY = 'kinotch-site-kit-m0-demo-theme';

function Fixture() {
  const [count, setCount] = useState(0);
  const [recorded, setRecorded] = useState('未割当');
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return MODES.includes(saved) ? saved : 'system';
    } catch { return 'system'; }
  });
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const desktopButton = useRef(null);
  const desktopMenu = useRef(null);
  const recorder = useHotkeyRecorder({
    onRecord: value => setRecorded(String(value)),
    onCancel: () => setRecorded('キャンセル')
  });
  const toggleTheme = () => {
    setMode(current => {
      const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage optional */ }
      return next;
    });
  };
  useEffect(() => {
    window.__m0ReactMounted = true;
    return () => { window.__m0ReactMounted = false; };
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.demoTheme = mode === 'system'
        ? (media.matches ? 'dark' : 'light') : mode;
    };
    apply();
    media.addEventListener?.('change', apply);
    return () => media.removeEventListener?.('change', apply);
  }, [mode]);
  useEffect(() => {
    if (!desktopMenuOpen) return;
    const onKey = event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setDesktopMenuOpen(false);
      desktopButton.current?.focus();
    };
    const onOutside = event => {
      if (!desktopMenu.current?.contains(event.target) && !desktopButton.current?.contains(event.target)) {
        setDesktopMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
    };
  }, [desktopMenuOpen]);
  return <wa-page id="react-shell" mobile-breakpoint="760">
    <header slot="header" className="demo-header">
      <span className="brand">KiNoTch. / Site Kit <span className="tag">React 検証版</span></span>
      <div className="header-actions">
        <wa-button data-toggle-nav size="small" aria-label="スマホメニューを開閉">☰ メニュー</wa-button>
        <button id="react-desktop-menu-toggle" ref={desktopButton} className="menu-trigger desktop-only" type="button"
          aria-controls="react-desktop-menu" aria-expanded={desktopMenuOpen}
          onClick={() => setDesktopMenuOpen(v => !v)}>☰ メニュー</button>
        <button id="react-theme" className="menu-trigger" type="button" data-mode={mode}
          aria-label={'現在 ' + LABELS[mode] + '。押すと表示モードを切替'} onClick={toggleTheme}>
          <span id="react-theme-icon" aria-hidden="true">{ICONS[mode]}</span> <span id="react-theme-label">{LABELS[mode]}</span>
        </button>
      </div>
      <nav id="react-desktop-menu" className="desktop-menu" ref={desktopMenu} aria-label="PC用メニュー" hidden={!desktopMenuOpen}>
        <a href="./">Vanilla JS 版</a>
        <a href="./react.html" aria-current="page" onClick={() => setDesktopMenuOpen(false)}>React 版</a>
        <a href="#react-detail" onClick={() => setDesktopMenuOpen(false)}>操作を試す</a>
        <a href="#react-status" onClick={() => setDesktopMenuOpen(false)}>実装状況</a>
      </nav>
    </header>
    <nav slot="navigation" className="demo-nav" aria-label="検証ページ一覧">
      <a href="./">Vanilla JS 版</a>
      <a href="./react.html" aria-current="page">React 版</a>
      <a href="#react-detail">操作を試す</a>
      <a href="#react-status">実装状況</a>
      <a href="https://github.com/kinoko34077/kinotch-site-kit/issues/20">改善Issue ↗</a>
    </nav>
    <main id="main" className="demo-main">
      <wa-breadcrumb><wa-breadcrumb-item href="./">Site Kit</wa-breadcrumb-item><wa-breadcrumb-item>React</wa-breadcrumb-item></wa-breadcrumb>
      <section className="hero">
        <p className="eyebrow">React版 • 同じ操作を別の技術で確認</p>
        <h1>押して、変化を確かめる。</h1>
        <p>上の☰でメニューを開き、🖥️/☀️/🌙で配色を変更。下では数字の変更と文字の保持を確認できます。</p>
        <p><a href="./">Vanilla JS版へ戻る →</a></p>
      </section>
      <div className="demo-grid" id="react-detail">
        <section className="demo-card">
          <h2>数字を増減する</h2>
          <p>ボタンを操作しても入力内容は消えません。</p>
          <div className="controls">
            <button id="react-action" type="button" onClick={() => setCount(n => n + 1)}>1 増やす</button>
            <button id="react-reset" type="button" onClick={() => setCount(0)}>0 に戻す</button>
          </div>
          <output id="react-count" className="demo-output" data-count={count} aria-live="polite">{count}</output>
        </section>
        <section className="demo-card">
          <h2>キーの組合せを記録</h2>
          <p>「記録開始」後にキーを押します。割当変更はまだ未実装です。</p>
          <div className="controls"><button id="react-record" type="button"
            onClick={() => { setRecorded('記録中…'); recorder.startRecording(); }}>記録開始</button></div>
          <output id="react-recorded" className="demo-output" aria-live="polite">{recorded}</output>
        </section>
        <section className="demo-card">
          <h2>入力した文字を保持する</h2>
          <p>文字を入力してから、数字やテーマを変えて確認できます。</p>
          <label htmlFor="react-text">自由入力</label>
          <input id="react-text" defaultValue="unchanged"/>
        </section>
      </div>
      <section id="react-status" className="feature-status">
        <h2>実装状況</h2>
        <div className="status-columns">
          <div><h3>試せる <span className="tag">サンプル</span></h3>
            <p>PC/スマホメニュー、テーマ切替、パンくず、React状態管理、キー記録、入力の保持。</p></div>
          <div><h3>今後作る <span className="tag pending">未実装</span></h3>
            <p>サイトをまたぐ共通API、自由なホットキー割当、サイト別設定、標準ページ・検索・多言語・SEO。</p>
            <p><a href="https://github.com/kinoko34077/kinotch-site-kit/issues/10">ロードマップ ↗</a></p></div>
        </div>
      </section>
      <p className="demo-note">M0の動作見本です。共通ライブラリ本体は未完成で、入力した文字はサーバーへ送信しません。</p>
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
