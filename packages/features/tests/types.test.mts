import {createActionRegistry, normalizeShortcut, type ActionDefinition, type ActionInfo} from '../actions.mjs';
import {createPageRegistry, type StandardPageInput} from '../pages.mjs';
const one: ActionDefinition = {id:'help',title:'Help',defaultShortcut:'Alt+Shift+H',run(ctx){ctx.trigger;}};
const target = new EventTarget();
const registry = createActionRegistry({target,actions:[one],onChange(items:ActionInfo[]){items.length;}});
registry.bind('help',normalizeShortcut('Alt+Shift+J')); registry.reset('help'); registry.dispose();
const pages: StandardPageInput[] = [{id:'help',kind:'help',title:'Help',enabled:true,content:'Demo'}];
createPageRegistry(pages).renderText('help').text;
// @ts-expect-error unsupported page kind
const invalid: StandardPageInput = {id:'payment',kind:'payment',title:'Wrong'};
void invalid;
// @ts-expect-error no HTML-specified content field; legal requires explicit typed text
createPageRegistry([{id:'help',kind:'help',title:'Help',html:'<b>unsafe</b>'}]);
// @ts-expect-error action callbacks must be functions
const invalidAction: ActionDefinition = {id:'bad',title:'bad',run:'alert'};
void invalidAction;

import {createPageMetadata, createSitemapXml, type PageMetadata} from '../seo.mjs';
import {createSiteDefinition} from '../../core/index.mjs';
const site = createSiteDefinition({id:'demo',name:'Demo',routes:[{id:'home',path:'/',title:'Home'}]});
const metadata: PageMetadata = createPageMetadata(site,{origin:'https://example.com',routeId:'home'});
const sitemap: string = createSitemapXml(site,{origin:'https://example.com'});
void metadata; void sitemap;
// @ts-expect-error route identifier is mandatory
createPageMetadata(site,{origin:'https://example.com'});

import {createLocalSearchIndex, searchIndexFromPages, type LocalSearchResult} from '../search.mjs';
const local=createLocalSearchIndex([{id:'help',title:'Help',text:'Example'}],{maxResults:5});
const result:LocalSearchResult[] = local.query('Help',{limit:2});
void result;
// @ts-expect-error search document must have source text
createLocalSearchIndex([{id:'x',title:'Missing text'}]);

import {createHistory,type HistorySnapshot} from '../history.mjs';
const reversible=createHistory({value:1},{limit:10,onChange(snapshot:HistorySnapshot){void snapshot.canUndo;}});
reversible.commit({value:2});reversible.undo();reversible.dispose();
// @ts-expect-error history limit must be a number
createHistory(0,{limit:'all'});

import {createLocalization,type Localization} from '../i18n.mjs';
const locale:Promise<Localization>=createLocalization({resources:{ja:{title:'日本語'},en:{title:'English'}},language:'ja',fallbackLanguage:'ja'});
void locale;
// @ts-expect-error locale resources must contain string translations
createLocalization({resources:{ja:{title:123}}});
