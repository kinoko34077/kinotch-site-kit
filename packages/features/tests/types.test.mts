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
