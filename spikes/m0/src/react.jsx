// React host / Web Components compatibility preview. Not the finished shared Site Kit.
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { useHotkeyRecorder } from '@tanstack/react-hotkeys';
import { createSiteController, navigation, breadcrumbs } from '../../../packages/core/index.mjs';
import { createReactStateAdapter } from '../../../packages/adapters/react.mjs';
import { siteInputForPath } from './site-contract.js';
import { createActionRegistry } from '../../../packages/features/actions.mjs';
import { previewPageRegistry, PREVIEW_SHORTCUTS } from './feature-demo.js';
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
const previewPages = previewPageRegistry();

function Fixture() {
  const [count, setCount] = useState(0);
  const [coreSite, setCoreSite] = useState(null);
  const [recorded, setRecorded] = useState('未割当');
  const [standardPage, setStandardPage] = useState('help');
  const [shortcuts, setShortcuts] = useState([]);
  const [shortcutInput, setShortcutInput] = useState(PREVIEW_SHORTCUTS.notice);
  const [shortcutMessage, setShortcutMessage] = useState('');
  const [noticeCount, setNoticeCount] = useState(0);
  const actionsRef = useRef(null);
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
    const controller = createSiteController(siteInputForPath(location.pathname));
    controller.mount({}, createReactStateAdapter(setCoreSite));
    window.__m0ReactCore = controller;
    return () => {
      controller.dispose();
      window.__m0ReactCore = undefined;
    };
  }, []);
  useEffect(() => {
    const registry = createActionRegistry({
      target: document,
      storage: (() => {try {return localStorage;} catch {return undefined;}})(),
      storageKey: 'kinotch-site-kit-demo-shortcuts-v1',
      actions: [
        {id:'demo:notice',title:'通知を表示',defaultShortcut:PREVIEW_SHORTCUTS.notice,
          run:() => setNoticeCount(n=>n+1)},
        {id:'demo:help',title:'ヘルプを表示',defaultShortcut:PREVIEW_SHORTCUTS.help,
          run:() => {setStandardPage('help'); document.getElementById('react-page-title')?.focus();}}
      ],
      onChange: list => setShortcuts(list)
    });
    actionsRef.current = registry;
    setShortcuts(registry.list());
    window.__siteKitReactActions = registry;
    return () => {
      registry.dispose();
      actionsRef.current = null;
      window.__siteKitReactActions = undefined;
    };
  }, []);
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
  const page = previewPages.renderText(standardPage);
  const noticeShortcut = shortcuts.find(x=>x.id==='demo:notice')?.shortcut ?? '未設定';
  const helpShortcut = shortcuts.find(x=>x.id==='demo:help')?.shortcut ?? '未設定';
  const changeBinding = () => {
    try {
      const normalized = actionsRef.current.bind('demo:notice', shortcutInput);
      setShortcutInput(normalized);
      setShortcutMessage('');
    } catch (error) { setShortcutMessage(error?.message ?? '登録に失敗しました'); }
  };
  return <wa-page id="react-shell" mobile-breakpoint="760">
    <header slot="header" className="demo-header">
      <span className="brand">KiNoTch. / Site Kit <span className="tag">React 検証版</span></span>
      <div className="header-actions">
        <wa-button data-toggle-nav size="small" aria-label="スマホメニューを開閉">☰ メニュー</wa-button>
        <button id="react-desktop-menu-toggle" ref={desktopButton} className="menu-trigger desktop-only" type="button"
          aria-controls="react-desktop-menu" aria-expanded={desktopMenuOpen}
          onClick={() => setDesktopMenuOpen(v => !v)}>☰ メニュー</button>
        <button id="react-theme" className="menu-trigger icon-only-theme" type="button" data-mode={mode}
          aria-label={'現在 ' + LABELS[mode] + '。押すと表示モードを切替'} onClick={toggleTheme}>
          <span id="react-theme-icon" aria-hidden="true">{ICONS[mode]}</span>
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
      <section className="feature-status" id="react-combo-features">
        <h2>標準ページとショートカットを組み合わせる</h2>
        <div className="demo-grid">
          <div className="demo-card">
            <h2>標準ページ</h2>
            <nav id="react-std-page-nav" className="controls" aria-label="利用可能な標準ページ">
              {previewPages.links().map(item=><button type="button" data-page={item.id} key={item.id}
                aria-pressed={standardPage === item.id} onClick={()=>setStandardPage(item.id)}>{item.title}</button>)}
            </nav>
            <h3 id="react-page-title" tabIndex={-1}>{page.title}</h3>
            <p id="react-page-content" className="demo-note">{page.text}</p>
            <p className="demo-note">プライバシー・利用規約は実内容と承認がないため公開されません。</p>
          </div>
          <div className="demo-card">
            <h2>キー割当と実行</h2>
            <div className="controls">
              <button id="react-shortcut-notice" type="button" onClick={()=>actionsRef.current?.invoke('demo:notice')}>通知を実行</button>
              <button id="react-shortcut-help" type="button" onClick={()=>actionsRef.current?.invoke('demo:help')}>ヘルプを開く</button>
            </div>
            <label htmlFor="react-shortcut-input">通知を出すキーの組合せ</label>
            <input id="react-shortcut-input" value={shortcutInput} onChange={e=>setShortcutInput(e.target.value)}/>
            <div className="controls">
              <button id="react-shortcut-apply" type="button" onClick={changeBinding}>変更</button>
              <button id="react-shortcut-clear" type="button" onClick={()=>{
                actionsRef.current?.unbind('demo:notice');
                setShortcutMessage('通知のキー割当を解除しました');
              }}>解除</button>
              <button id="react-shortcut-reset" type="button" onClick={()=>{
                actionsRef.current?.reset('demo:notice');
                setShortcutInput(PREVIEW_SHORTCUTS.notice);setShortcutMessage('');
              }}>元に戻す</button>
            </div>
            <output id="react-shortcut-status" className="demo-output" aria-live="polite">
              {shortcutMessage || ('通知: '+noticeShortcut+' / ヘルプ: '+helpShortcut)}
            </output>
            <output id="react-notice-count" className="demo-output" aria-live="polite">通知を実行した回数: {noticeCount}</output>
          </div>
        </div>
      </section>
      <section className="feature-status">
        <h2>共通Coreのナビゲーション（M1技術試作）</h2>
        <p>Vanilla JSと同じサイト設定を、Reactが自分の状態として表示しています。</p>
        <nav id="core-react-nav" className="core-links" aria-label="共通Coreの経路">
          {coreSite && navigation(coreSite).map(route =>
            <a key={route.id} href={route.url} aria-current={route.id === 'react' ? 'page' : undefined}>{route.title}</a>
          )}
        </nav>
        <p id="core-react-breadcrumbs" className="demo-note">
          {coreSite ? breadcrumbs(coreSite, 'react').map(item => item.title).join(' › ') : '読み込み中'}
        </p>
      </section>
      <section id="react-status" className="feature-status">
        <h2>実装状況</h2>
        <div className="status-columns">
          <div><h3>試せる <span className="tag">サンプル</span></h3>
            <p>PC/スマホメニュー、テーマ切替、パンくず、React状態管理、キー記録、入力の保持。</p></div>
          <div><h3>今後作る <span className="tag pending">未実装</span></h3>
            <p>ヘルプ／概要の見本と割当変更は試験可能。全サイト対応の正式API、法務内容の確定、検索・多言語・SEOなどは未完了。</p>
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
