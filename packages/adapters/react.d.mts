import type { HostAdapter, SiteDefinition } from '../core/index.mjs';
/** The caller owns React state; this adapter has no runtime React dependency. */
export function createReactStateAdapter(onDefinition: (value: SiteDefinition) => void): HostAdapter<unknown>;
