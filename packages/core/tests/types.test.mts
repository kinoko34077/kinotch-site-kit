import {
  createSiteDefinition, createSiteController, routeUrl, breadcrumbs,
  type SiteDefinition, type HostAdapter, type Theme, type Layout
} from '../index.mjs';

const theme: Theme = 'dark';
const layout: Layout = 'immersive';
const def: SiteDefinition = createSiteDefinition({
  id: 'demo', name: 'Demo', basePath: '/demo/', layout, theme,
  routes: [{id:'home',path:'/',title:'Home'}], features: {help: true}
}, { preference: {theme: 'light'}, routeOverride: {layout: 'content'} });
const path: string = routeUrl(def, 'home');
const crumbs: {title: string; url: string}[] = breadcrumbs(def, 'home');
void path; void crumbs;

const host: { children: unknown[] } = {children: []};
const adapter: HostAdapter<typeof host> = {
  mount(_host, current) {
    const firstName: string = current.name;
    void firstName;
    return {update(next) { void next.layout; }, dispose() {}};
  }
};
createSiteController<typeof host>({id:'demo',name:'Demo'}).mount(host, adapter);

// @ts-expect-error unknown layout cannot be assigned to a supported union
const invalidLayout: Layout = 'admin';
void invalidLayout;

// @ts-expect-error route override must never change the site's basePath
createSiteDefinition({id:'x',name:'X'}, {routeOverride: {basePath: '/changed/'}});

// @ts-expect-error user preference must never override site security/feature settings
createSiteDefinition({id:'x',name:'X'}, {preference: {features: {auth: false}}});
