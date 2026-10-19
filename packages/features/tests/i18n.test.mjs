import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalization} from '../i18n.mjs';

const dictionaries=()=>({
  ja:{title:'ヘルプ',welcome:'こんにちは、{{name}}さん',plural_one:'{{count}}個',plural_other:'{{count}}個'},
  en:{title:'Help',welcome:'Hello, {{name}}',plural_one:'{{count}} item',plural_other:'{{count}} items'}
});
test('host-owned i18next instance translates without global DOM/network',async()=>{
  const locale=await createLocalization({resources:dictionaries(),language:'ja',fallbackLanguage:'ja'});
  assert.deepEqual(locale.available(),['ja','en']);
  assert.equal(locale.t('title'),'ヘルプ');
  assert.equal(locale.t('welcome',{name:'<b>'}),'こんにちは、&lt;b&gt;さん');
  assert.equal(locale.direction(),'ltr');
  assert.ok(locale.formatNumber(1200,{useGrouping:true}).length>0);
  assert.ok(locale.formatDate(new Date('2026-10-19T00:00:00Z'),{timeZone:'UTC'}).length>0);
  locale.dispose();
  assert.throws(()=>locale.t('title'),/disposed/);
});
test('supports rapid language changes in requested order with retained subscriber contract',async()=>{
  const locale=await createLocalization({resources:dictionaries(),language:'ja'});
  const changes=[];const off=locale.subscribe(next=>changes.push(next));
  const a=locale.setLanguage('en'),b=locale.setLanguage('ja'),c=locale.setLanguage('en');
  await Promise.all([a,b,c]);
  assert.equal(locale.language,'en');
  assert.equal(locale.t('title'),'Help');
  assert.equal(locale.t('plural',{count:2}),'2 items');
  assert.deepEqual(changes,['en','ja','en']);
  off();await locale.setLanguage('ja');
  assert.equal(changes.length,3);
  locale.dispose();
});
test('validates unsafe/untrusted resources and refuses unsupported locale',async()=>{
  for(const resources of [
    {},{'../':{title:'no'}},{ja:{bad:42}},{ja:{'<script>':'x'}},
    {ja:{title:'t'.repeat(10001)}}
  ]){
    await assert.rejects(createLocalization({resources,language:'ja'}),/invalid|resource|selected/i);
  }
  const locale=await createLocalization({resources:dictionaries(),language:'ja'});
  assert.throws(()=>locale.setLanguage('fr'),RangeError);
  assert.throws(()=>locale.t('../unsafe'),TypeError);
  locale.dispose();
});
