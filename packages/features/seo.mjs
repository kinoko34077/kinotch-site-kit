/**
 * Experimental site-owned metadata adapter (#7). No network, analytics, or
 * injected HTML; origin and route IDs must be explicit and validated.
 */
import { routeUrl, navigation } from '../core/index.mjs';

function validOrigin(value) {
  if (typeof value !== 'string') throw new TypeError('public origin must be text');
  let url;
  try { url = new URL(value); } catch { throw new TypeError('invalid public origin'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.pathname !== '/') throw new TypeError('public origin must be an HTTPS origin only');
  return url.origin;
}
function validDescription(value) {
  if (typeof value !== 'string' || value.length > 300) throw new TypeError('description must be text no longer than 300 characters');
  return value.trim();
}
function asUrl(origin, path) {
  const target = new URL(path, origin);
  if (target.origin !== origin || !target.pathname.startsWith('/')) {
    throw new TypeError('route URL escaped the site origin');
  }
  return target.href;
}
export function createPageMetadata(definition, { origin, routeId, description = '', noIndex = false } = {}) {
  if (typeof routeId !== 'string') throw new TypeError('routeId required');
  if (typeof noIndex !== 'boolean') throw new TypeError('noIndex must be boolean');
  const host = validOrigin(origin);
  const route = definition.routes.find(x => x.id === routeId);
  if (!route) throw new RangeError('unknown route for metadata');
  return Object.freeze({
    title: route.title + ' | ' + definition.name,
    description: validDescription(description),
    canonical: asUrl(host, routeUrl(definition, routeId)),
    robots: noIndex ? 'noindex, nofollow' : 'index, follow'
  });
}
function xmlText(value) {
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
export function createSitemapXml(definition, { origin } = {}) {
  const host = validOrigin(origin);
  const nodes = navigation(definition).map(route => asUrl(host,route.url));
  const body = nodes.map(url => '  <url><loc>' + xmlText(url) + '</loc></url>').join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body + (body ? '\n' : '') + '</urlset>\n';
}
/**
 * Optional DOM integration. Restores all previous document-owned metadata on
 * dispose, avoiding permanent edits to React or independent host pages.
 */
export function applyPageMetadata(doc, metadata) {
  if (!doc || typeof doc.createElement !== 'function' || !doc.head) throw new TypeError('document required');
  if (!metadata || typeof metadata.title !== 'string') throw new TypeError('metadata required');
  const previousTitle = doc.title;
  const nodes = [];
  function set(tag, attr, value) {
    let element = doc.head.querySelector(tag);
    const existed = !!element;
    if (!element) { element = doc.createElement(tag.split('[')[0]); doc.head.append(element); }
    const before = existed ? element.getAttribute(attr) : null;
    element.setAttribute(attr,value);
    nodes.push({element,attr,before,existed});
  }
  set('meta[name="description"]','content',metadata.description);
  nodes[nodes.length - 1].element.setAttribute('name','description');
  set('meta[name="robots"]','content',metadata.robots);
  nodes[nodes.length - 1].element.setAttribute('name','robots');
  set('link[rel="canonical"]','href',metadata.canonical);
  nodes[nodes.length - 1].element.setAttribute('rel','canonical');
  doc.title = metadata.title;
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true; doc.title = previousTitle;
    for (const {element,attr,before,existed} of nodes.reverse()) {
      if (!existed) element.remove();
      else if (before === null) element.removeAttribute(attr);
      else element.setAttribute(attr,before);
    }
  };
}
