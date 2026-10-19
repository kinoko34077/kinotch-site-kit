import type { SiteDefinition } from '../core/index.mjs';
export interface PageMetadata {readonly title: string;readonly description: string;readonly canonical: string;readonly robots: 'index, follow' | 'noindex, nofollow'}
export function createPageMetadata(definition: SiteDefinition, options: {origin:string; routeId:string; description?:string; noIndex?:boolean}): PageMetadata;
export function createSitemapXml(definition: SiteDefinition, options: {origin:string}): string;
export function applyPageMetadata(doc: Document, metadata: PageMetadata): () => void;
