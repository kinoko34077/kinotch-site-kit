export type PublicAssetStrategy = 'network-first' | 'cache-first';
export interface PublicAssetCache {
  readonly cacheName: string;
  handle(request: Request, strategy?: PublicAssetStrategy): Promise<Response> | null;
  removeVersion(previousVersion: string): Promise<boolean>;
}
export interface PublicAssetCacheOptions {
  scope: string;
  appId: string;
  version: string;
  assets: readonly string[];
  storage?: Pick<CacheStorage, 'open' | 'delete'>;
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
}
export function createPublicAssetCache(options: PublicAssetCacheOptions): PublicAssetCache;
