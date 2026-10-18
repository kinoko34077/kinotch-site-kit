/** Experimental v1 Site Kit core contracts; no browser or framework dependency. */
export type Layout = 'content' | 'application' | 'immersive' | 'custom';
export type Theme = 'system' | 'light' | 'dark';
export type Source = 'default' | 'preset' | 'site' | 'route' | 'preference';
export interface RouteInput { id: string; path: string; title: string; parent?: string; nav?: boolean }
export interface Route { readonly id: string; readonly path: string; readonly title: string; readonly parent: string | null; readonly nav: boolean }
export interface SiteInput {
  id: string; name: string; basePath?: string; layout?: Layout; theme?: Theme;
  routes?: readonly RouteInput[]; features?: Readonly<Record<string, boolean>>;
}
export interface SiteLayers {
  preset?: { layout?: Layout; theme?: Theme; features?: Readonly<Record<string, boolean>> };
  routeOverride?: { layout?: Layout; theme?: Theme };
  preference?: { theme?: Theme };
}
export interface SiteDefinition {
  readonly schemaVersion: 1; readonly id: string; readonly name: string; readonly basePath: string;
  readonly layout: Layout; readonly theme: Theme;
  readonly routes: readonly Route[]; readonly features: Readonly<Record<string, boolean>>;
  readonly provenance: Readonly<{ layout: Source; theme: Source; basePath: Source; features: Source }>;
}
export interface HostBinding { update(definition: SiteDefinition): void; dispose(): void }
export interface HostAdapter<THost> { mount(host: THost, definition: SiteDefinition): HostBinding }
export interface SiteController<THost = unknown> {
  readonly definition: SiteDefinition; readonly isMounted: boolean; readonly isDisposed: boolean;
  subscribe(callback: (value: SiteDefinition) => void): () => void;
  mount(host: THost, adapter: HostAdapter<THost>): this;
  update(input: SiteInput, layers?: SiteLayers): this;
  unmount(): this;
  dispose(): void;
}
export function createSiteDefinition(input: SiteInput, options?: SiteLayers): SiteDefinition;
export function routeUrl(definition: SiteDefinition, id: string): string;
export function breadcrumbs(definition: SiteDefinition, id: string): {id: string; title: string; url: string}[];
export function navigation(definition: SiteDefinition): {id: string; title: string; url: string}[];
export function featureEnabled(definition: SiteDefinition, id: string): boolean;
export function createSiteController<THost = unknown>(input: SiteInput, options?: SiteLayers): SiteController<THost>;
