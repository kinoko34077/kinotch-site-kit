import { createPageRegistry } from '../../../packages/features/pages.mjs';

/** These are demo-only authored examples, not a site-wide legal-policy generator. */
export function previewPageRegistry() {
  return createPageRegistry([
    { id:'help', kind:'help',title:'ヘルプ', enabled:true,
      content:'① ☰ からページを移動。② 🖥️ のボタンで表示を切替。③ この欄から標準ページを開けます。ショートカットは下の設定から変更できます。' },
    { id:'about',kind:'about',title:'このサイトについて',enabled:true,
      content:'KiNoTch. Site Kit の検証環境です。複数サイトへ再利用するUI部品の組合せを確認します。公開ライブラリの製品版ではありません。' },
    { id:'privacy',kind:'privacy',title:'プライバシー',enabled:true },
    { id:'terms',kind:'terms',title:'利用規約',enabled:false }
  ]);
}
export const PREVIEW_SHORTCUTS = Object.freeze({
  notice: 'Alt+Shift+K',
  help: 'Alt+Shift+H'
});
