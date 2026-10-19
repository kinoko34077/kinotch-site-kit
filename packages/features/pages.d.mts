/** Experimental safe plain-text standard-page registry contract. */
export type StandardPageKind = 'about' | 'help' | 'contact' | 'not-found' | 'privacy' | 'terms' | 'cookies';
export interface StandardPageInput {
  id: string; kind: StandardPageKind; title: string; enabled?: boolean;
  content?: string;
  /** Legal pages additionally require explicit approval by the site owner before exposure. */
  reviewed?: boolean;
}
export interface StandardPage {
  readonly id: string; readonly kind: StandardPageKind; readonly title: string;
  readonly content: string; readonly enabled: boolean; readonly ready: boolean;
  readonly requiresReview: boolean; readonly reviewed: boolean;
}
export interface StandardPageRegistry {
  all(): StandardPage[];
  links(): {id: string; title: string; kind: StandardPageKind}[];
  get(id: string): StandardPage | null;
  visible(id: string): boolean;
  renderText(id: string): {readonly id: string; readonly title: string;
    readonly kind: StandardPageKind; readonly text: string; readonly legalNotice: string | null};
}
export function createPageRegistry(pages?: StandardPageInput[]): StandardPageRegistry;
