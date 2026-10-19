import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalSearchIndex,searchIndexFromPages} from '../search.mjs';
import {createPageRegistry} from '../pages.mjs';
const items=[
  {id:'about',title:'サイトについて',text:'このページはテーマ、ナビゲーション、検索の実験です。'},
  {id:'help',title:'ヘルプ',text:'ハンバーガーメニュー、ショートカットやテーマ切替を操作できます。'},
  {id:'contact',title:'お問い合わせ',text:'連絡方法はサイトごとに設定してください。'}
];
test('Japanese Unicode normalization, substring and multiword intersection',()=>{
  const index=createLocalSearchIndex(items);
  assert.equal(index.size,3);
  assert.deepEqual(index.query('テーマ').map(r=>r.id),['about','help']);
  assert.deepEqual(index.query('めにゅー'),[]);
  assert.deepEqual(index.query('メニュー ショートカット').map(x=>x.id),['help']);
  assert.deepEqual(index.query('  ').map(x=>x.id),[]);
  assert.equal(index.query('ﾍﾙﾌﾟ')[0].id,'help');
});
test('title match priority and limited deterministic results',()=>{
  const index=createLocalSearchIndex(items,{maxResults:2});
  assert.equal(index.query('ヘルプ')[0].id,'help');
  assert.equal(index.query('テーマ',{limit:1}).length,1);
  assert.throws(()=>index.query('テーマ',{limit:3}),TypeError);
  assert.equal(index.query('not-here').length,0);
});
test('search index automatically excludes disabled and unreviewed legal content',()=>{
  const registry=createPageRegistry([
    {id:'help',kind:'help',title:'ヘルプ',enabled:true,content:'案内はこちら'},
    {id:'privacy',kind:'privacy',title:'個人情報の扱い',enabled:true,content:'未承認の機密ドラフト'},
    {id:'terms',kind:'terms',title:'利用規約',enabled:false,reviewed:true,content:'非公開ドラフト'},
    {id:'about',kind:'about',title:'概要',enabled:false,content:'見せない'}
  ]);
  const idx=searchIndexFromPages(registry);
  assert.equal(idx.size,1);
  assert.equal(idx.query('案内')[0].id,'help');
  assert.equal(idx.query('未承認').length,0);
  assert.equal(idx.query('ドラフト').length,0);
  assert.equal(idx.query('個人情報').length,0);
});
test('text remains literal; no URLs/HTML or network callbacks are generated',()=>{
  const index=createLocalSearchIndex([{id:'safe',title:'<img onerror=alert(1)>',text:'<script>alert(1)</script>'}]);
  const result=index.query('alert');
  assert.equal(result.length,1);
  assert.match(result[0].snippet,/<script>/);
  assert.deepEqual(Object.keys(result[0]),['id','title','snippet']);
  assert.ok(Object.isFrozen(result[0]));
});
test('rejects invalid shapes, duplicate IDs, unbounded content and query abuse',()=>{
  const bad=[
    [{id:'x',title:'X',text:'x'},{id:'x',title:'X',text:'duplicate'}],
    [{id:'x',title:'X',text:'x',html:'no'}],
    [{id:'a',title:'',text:'x'}],
    [{id:'x',title:'X',text:'x'.repeat(20001)}],
    [{id:'bad/path',title:'X',text:'x'}]
  ];
  for(const docs of bad) assert.throws(()=>createLocalSearchIndex(docs),TypeError);
  assert.throws(()=>createLocalSearchIndex(items,{maxResults:0}),TypeError);
  const idx=createLocalSearchIndex(items);
  assert.throws(()=>idx.query('x'.repeat(121)),TypeError);
  assert.throws(()=>idx.query('a b c d e f g h i'),TypeError);
  assert.throws(()=>idx.query(4),TypeError);
});
