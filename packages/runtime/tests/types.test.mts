import {createFeatureCatalog, standardFeatureLoaders, type FeatureCatalog} from '../catalog.mjs';
const catalog:FeatureCatalog = createFeatureCatalog();
const names:string[] = catalog.available();
const loaded:Promise<object> = catalog.load('history');
const batch:Promise<Record<string,object>> = catalog.loadSelected(['history']);
void names;void loaded;void batch;
const injected = createFeatureCatalog({loaders:{demo: async()=>({ok:true})}});
void injected;void standardFeatureLoaders;
// @ts-expect-error loader must be callable
createFeatureCatalog({loaders:{bad:true}});
