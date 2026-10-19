/**
 * Small, strictly local optional search for site-owned page content.
 * A static-site Pagefind adapter may be added separately; this module uses
 * no network, telemetry, DOM, HTML injection, backend or paid service.
 */
const ID = /^[a-z][a-z0-9_-]*$/;
const MAX_DOCS = 512;
function normalize(value) {
  return value.normalize('NFKC').toLocaleLowerCase('und');
}
function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}
export function createLocalSearchIndex(documents, { maxResults = 8 } = {}) {
  if (!Array.isArray(documents) || documents.length > MAX_DOCS) throw new TypeError('invalid local search document list');
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 30) throw new TypeError('maxResults must be 1..30');
  const seen = new Set();
  const entries = documents.map((document, index) => {
    if (!plain(document) || Object.keys(document).some(x => !['id','title','text'].includes(x))) {
      throw new TypeError('invalid search document at ' + index);
    }
    const {id,title,text} = document;
    if (typeof id !== 'string' || !ID.test(id) || seen.has(id)) throw new TypeError('duplicate/invalid document id');
    if (typeof title !== 'string' || !title.trim() || title.length > 140 ||
      typeof text !== 'string' || text.length > 20000) throw new TypeError('invalid document content');
    seen.add(id);
    return Object.freeze({id,title:title.trim(),text, normalizedTitle:normalize(title.trim()), normalizedText:normalize(text)});
  });
  function query(input, { limit = maxResults } = {}) {
    if (typeof input !== 'string' || input.length > 120) throw new TypeError('search query must be text up to 120 characters');
    if (!Number.isInteger(limit) || limit < 1 || limit > maxResults) throw new TypeError('invalid result limit');
    const words = normalize(input.trim()).split(/\s+/u).filter(Boolean);
    if (!words.length) return [];
    if (words.length > 8) throw new TypeError('too many search terms');
    const matches = [];
    for (let i=0; i<entries.length; i++) {
      const item = entries[i];
      if (!words.every(word => item.normalizedTitle.includes(word) || item.normalizedText.includes(word))) continue;
      let score = 0;
      for (const word of words) {
        if (item.normalizedTitle === word) score += 12;
        else if (item.normalizedTitle.includes(word)) score += 5;
        if (item.normalizedText.includes(word)) score += 1;
      }
      // Snippets are text, never parsed as HTML.
      const first = item.normalizedText.indexOf(words[0]);
      const start = Math.max(0, first - 34);
      const snippet = item.text.slice(start, start + 130);
      matches.push({id:item.id,title:item.title,snippet,score,ordinal:i});
    }
    matches.sort((a,b) => b.score-a.score || a.ordinal-b.ordinal);
    return matches.slice(0,limit).map(({id,title,snippet}) => Object.freeze({id,title,snippet}));
  }
  return Object.freeze({size:entries.length,query});
}
export function searchIndexFromPages(registry) {
  if (!registry || typeof registry.links !== 'function' || typeof registry.renderText !== 'function') {
    throw new TypeError('valid opt-in standard page registry required');
  }
  // Disabled or not-yet-owner-reviewed legal pages never enter the index.
  return createLocalSearchIndex(registry.links().map(({id}) => {
    const p = registry.renderText(id);
    return {id:p.id,title:p.title,text:p.text};
  }));
}
