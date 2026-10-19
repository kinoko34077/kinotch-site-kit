/**
 * Optional standard-page model: safe text-only content, no invented legal claims.
 * Enabled pages are published only if content is explicitly supplied. Issue #7.
 */
const ID = /^[a-z][a-z0-9_-]*$/;
const LEGAL = new Set(['privacy','terms','cookies']);
const KINDS = new Set(['about','help','contact','not-found',...LEGAL]);
export function createPageRegistry(input = []) {
  if (!Array.isArray(input)) throw new TypeError('pages must be an array');
  const records = new Map();
  for (const entry of input) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
        Object.getPrototypeOf(entry) !== Object.prototype) throw new TypeError('invalid page config');
    for (const key of Object.keys(entry)) if (!['id','kind','title','content','enabled'].includes(key)) {
      throw new TypeError('unknown page attribute: ' + key);
    }
    const id = entry.id;
    if (typeof id !== 'string' || !ID.test(id) || records.has(id)) throw new TypeError('invalid/duplicate page id');
    if (!KINDS.has(entry.kind)) throw new TypeError('unsupported page kind');
    if (typeof entry.title !== 'string' || !entry.title.trim()) throw new TypeError('page title required');
    if (entry.enabled !== undefined && typeof entry.enabled !== 'boolean') throw new TypeError('enabled must be boolean');
    if (entry.content !== undefined && typeof entry.content !== 'string') throw new TypeError('content must be text');
    const enabled = entry.enabled === true;
    const content = entry.content?.trim() ?? '';
    const ready = enabled && content.length > 0;
    records.set(id, Object.freeze({ id,kind:entry.kind,title:entry.title.trim(),content,
      enabled,ready,requiresReview:LEGAL.has(entry.kind) }));
  }
  const api = Object.freeze({
    all() { return [...records.values()]; },
    links() { return [...records.values()].filter(p => p.ready).map(({id,title,kind})=>({id,title,kind})); },
    get(id) { return records.get(id) ?? null; },
    visible(id) { const p = records.get(id); return !!p?.ready; },
    renderText(id) {
      const p = records.get(id);
      if (!p || !p.ready) throw new RangeError('page missing, disabled or content not supplied');
      return Object.freeze({ id:p.id,title:p.title,kind:p.kind,text:p.content,
        legalNotice:p.requiresReview ? 'Site owner must verify legal applicability and published terms.' : null });
    }
  });
  return api;
}
