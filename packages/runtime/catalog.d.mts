export interface FeatureCatalog {
  available(): string[];
  loaded(id:string): boolean;
  load(id:string): Promise<object>;
  loadSelected(ids:string[]): Promise<Record<string, object>>;
}
export function createFeatureCatalog(options?: {
  loaders?: Record<string,()=>Promise<object>|object>
}):FeatureCatalog;
export const standardFeatureLoaders: Readonly<Record<string,()=>Promise<object>>>;
