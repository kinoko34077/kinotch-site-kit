import test from 'node:test';
import assert from 'node:assert/strict';
import { createActionRegistry, normalizeShortcut } from '../actions.mjs';
import { createPageRegistry } from '../pages.mjs';

class FakeEvents {
  listeners = new Set();
  addEventListener(type, fn) { if (type === 'keydown') this.listeners.add(fn); }
  removeEventListener(type, fn) { if (type === 'keydown') this.listeners.delete(fn); }
  press(key, options = {}) {
    let prevented = false;
    const event = {
      type: 'keydown', key, ctrlKey: false, altKey: true, shiftKey: true, metaKey: false,
      defaultPrevented: false, isComposing: false, repeat: false, target: {tagName:'DIV'},
      preventDefault() { prevented = true; }, ...options
    };
    for (const listener of this.listeners) listener(event);
    return prevented;
  }
}
const descriptors = (run = () => {}) => [
  { id:'nav:help', title:'ヘルプ', scope:'global', defaultShortcut:'Alt+Shift+H', run },
  { id:'nav:about', title:'概要', scope:'page', defaultShortcut:'Alt+Shift+A', run }
];
test('normalizes user shortcuts and refuses browser-reserved or unsafe combinations', () => {
  assert.equal(normalizeShortcut('shift+alt+h'), 'Alt+Shift+H');
  assert.equal(normalizeShortcut('Ctrl+Shift+Alt+k'), 'Ctrl+Alt+Shift+K');
  for(const bad of ['H','Shift+H','Ctrl+R','Meta+L','Alt+Enter','Alt+Shift+Escape','Alt+Alt+K','Ctrl+Q']) {
    assert.throws(()=>normalizeShortcut(bad), TypeError, bad);
  }
});

test('action registry handles keyboard or pointer, scoped route, safe editing and disposal', () => {
  const target = new FakeEvents(); const fired = [];
  const registry = createActionRegistry({target,actions:descriptors(({id,trigger})=>fired.push([id,trigger]))});
  assert.equal(target.listeners.size,1);
  assert.equal(target.press('h'),true);
  assert.equal(target.press('a'),false); // not in active scope
  registry.setScopes(['page']);
  assert.equal(target.press('a'),true);
  assert.deepEqual(fired,[['nav:help','keyboard'],['nav:about','keyboard']]);
  assert.equal(registry.invoke('nav:help'),true);
  assert.equal(registry.invoke('nav:about'),true);
  assert.equal(target.press('h',{target:{tagName:'INPUT'}}),false);
  assert.equal(target.press('h',{target:{tagName:'TEXTAREA'}}),false);
  assert.equal(target.press('h',{target:{tagName:'DIV',isContentEditable:true}}),false);
  assert.equal(target.press('h',{isComposing:true}),false);
  assert.equal(target.press('h',{key:'Process'}),false);
  assert.equal(target.press('h',{repeat:true}),false);
  assert.equal(target.press('h',{composedPath:()=>[{getAttribute:x=>x==='role'?'textbox':null}]}),false);
  registry.dispose(); registry.dispose();
  assert.equal(target.listeners.size,0);
  assert.equal(target.press('h'),false);
  assert.throws(()=>registry.bind('nav:help','Alt+Shift+U'),/disposed/);
});

test('rebind / unbind / reset and conflict never corrupt current binding', () => {
  const t = new FakeEvents();const reg = createActionRegistry({target:t,actions:descriptors()});
  assert.equal(reg.get('nav:help'),'Alt+Shift+H');
  assert.throws(()=>reg.bind('nav:about','Alt+Shift+H'), /conflict/);
  assert.equal(reg.get('nav:about'),'Alt+Shift+A');
  assert.equal(reg.bind('nav:about','Alt+Shift+N'),'Alt+Shift+N');
  assert.equal(reg.unbind('nav:about'),null);
  assert.equal(reg.get('nav:about'),null);
  reg.reset('nav:about');
  assert.equal(reg.get('nav:about'),'Alt+Shift+A');
  reg.resetAll();
  assert.equal(reg.get('nav:help'),'Alt+Shift+H');
  assert.throws(()=>reg.get('missing'),RangeError);
  reg.dispose();
});

test('global/page shortcut collisions rejected; distinct scoped actions can share keys', () => {
  const target = new FakeEvents();
  assert.throws(()=>createActionRegistry({target,actions:[
    {id:'a',title:'A',defaultShortcut:'Alt+Shift+H',run(){}},
    {id:'b',title:'B',scope:'page',defaultShortcut:'Alt+Shift+H',run(){}}
  ]}),/conflict/);
  assert.equal(target.listeners.size,0);
  const r=createActionRegistry({target,actions:[
    {id:'a',title:'A',scope:'page',defaultShortcut:'Alt+Shift+H',run(){}},
    {id:'b',title:'B',scope:'dialog',defaultShortcut:'Alt+Shift+H',run(){}}
  ]});
  assert.equal(r.list().length,2);
  r.dispose();
});

test('persistence is explicitly opt-in, survives reload and degrades when storage fails', () => {
  const backing=new Map();
  const storage={getItem:key=>backing.get(key)??null,setItem:(key,val)=>backing.set(key,val)};
  const target=new FakeEvents();let changed=0;
  const one=createActionRegistry({target,actions:descriptors(),storage,storageKey:'site-test',onChange:()=>changed++});
  one.bind('nav:help','Alt+Shift+N');one.dispose();
  const two=createActionRegistry({target,actions:descriptors(),storage,storageKey:'site-test',onChange:()=>changed++});
  assert.equal(two.get('nav:help'),'Alt+Shift+N');
  assert.equal(two.storageStatus,'loaded');
  assert.ok(changed>=2);
  two.dispose();
  const failing={getItem(){throw Error('private browsing');},setItem(){throw Error('quota');}};
  const third=createActionRegistry({target,actions:descriptors(),storage:failing});
  third.bind('nav:help','Alt+Shift+U');
  assert.equal(third.storageStatus,'unavailable');
  assert.equal(third.get('nav:help'),'Alt+Shift+U');
  third.dispose();
});

test('pages are disabled by default and only enabled authored content appears in links', () => {
  const p=createPageRegistry([
    {id:'help',kind:'help',title:'ヘルプ',enabled:true,content:'操作方法を説明します。'},
    {id:'privacy',kind:'privacy',title:'プライバシー',enabled:true},
    {id:'terms',kind:'terms',title:'利用規約',enabled:false,content:'Site owner draft'},
    {id:'about',kind:'about',title:'概要',content:'Not opted in'}
  ]);
  assert.deepEqual(p.links().map(x=>x.id),['help']);
  assert.equal(p.visible('privacy'),false);
  assert.equal(p.get('privacy').requiresReview,true);
  assert.throws(()=>p.renderText('privacy'),/not supplied/);
  assert.equal(p.renderText('help').text,'操作方法を説明します。');
});

test('legal page requires authored text and exposes review warning; default missing kind rejected', () => {
  const p=createPageRegistry([{id:'privacy',kind:'privacy',title:'プライバシー',enabled:true,content:'Site owner reviewed text'}]);
  assert.equal(p.links().length,1);
  assert.match(p.renderText('privacy').legalNotice,/verify legal/);
  for(const list of [
    [{id:'bad',kind:'privacy',title:'P',enabled:true,content:13}],
    [{id:'bad',kind:'payment',title:'P',enabled:true,content:'wrong'}],
    [{id:'help',kind:'help',title:'P',enabled:'true',content:'invalid'}],
    [{id:'help',kind:'help',title:'P',enabled:true,content:'OK'}, {id:'help',kind:'help',title:'P',enabled:true,content:'dup'}],
    [{id:'help',kind:'help',title:'P',enabled:true,content:'x',script:'unsafe'}]
  ]) assert.throws(()=>createPageRegistry(list),TypeError);
});
