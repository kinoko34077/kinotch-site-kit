import type { HostAdapter } from '../core/index.mjs';
/** Mount into a caller-owned HTMLElement, never claim siblings or document ownership. */
export function createVanillaNavigationAdapter(options?: { currentRouteId?: string }): HostAdapter<HTMLElement>;
