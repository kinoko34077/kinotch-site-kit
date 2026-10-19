import { createPageRegistry } from '../../../packages/features/pages.mjs';

/** These are demo-only authored examples, not a site-wide legal-policy generator. */
export function previewPageRegistry() {
  return createPageRegistry([
    { id:'help', kind:'help',title:'ヘルプ', enabled:true,
      content:'① ☰ メニューからページを移動。② 🖥️ のテーマボタンで表示を切り替えます。③ この欄から標準ページを開けます。ショートカットは下の設定から変更できます。' },
    { id:'about',kind:'about',title:'このサイトについて',enabled:true,
      content:'KiNoTch. Site Kit の検証環境です。テーマ、ナビゲーション、サイト内検索など、複数サイトへ再利用するUI部品の組合せを確認します。公開ライブラリの製品版ではありません。' },
    { id:'privacy',kind:'privacy',title:'プライバシー',enabled:true },
    { id:'terms',kind:'terms',title:'利用規約',enabled:false }
  ]);
}
export const PREVIEW_SHORTCUTS = Object.freeze({
  notice: 'Alt+Shift+K',
  help: 'Alt+Shift+H'
});

/** Bundled test-only dictionaries; not a network translation service. */
export const PREVIEW_LOCALE_RESOURCES = Object.freeze({
  ja: Object.freeze({ greeting: 'こんにちは。共通UIの多言語表示を試験しています。',
    summary: '選択した機能だけを読み込みます。' }),
  en: Object.freeze({ greeting: 'Hello. This is an optional Site Kit localization test.',
    summary: 'Only selected modules are loaded.' })
});
