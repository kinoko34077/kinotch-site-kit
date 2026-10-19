export interface LocalSearchDocument {id:string;title:string;text:string}
export interface LocalSearchResult {readonly id:string;readonly title:string;readonly snippet:string}
export interface LocalSearchIndex {
  readonly size:number;
  query(text:string, options?:{limit?:number}): LocalSearchResult[];
}
export function createLocalSearchIndex(
  documents: readonly LocalSearchDocument[],options?:{maxResults?:number}
):LocalSearchIndex;
export function searchIndexFromPages(registry: {
  links(): {id:string}[];
  renderText(id:string): {id:string;title:string;text:string};
}):LocalSearchIndex;
