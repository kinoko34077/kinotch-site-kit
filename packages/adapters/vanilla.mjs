import { navigation, breadcrumbs } from '../core/index.mjs';

/**
 * Bind a dedicated host element to shared SiteDefinition without importing UI vendors.
 * All created nodes are owned under one detachable container; host siblings remain intact.
 */
export function createVanillaNavigationAdapter({ currentRouteId = 'home' } = {}) {
  return {
    mount(host, definition) {
      if (!host || host.nodeType !== 1 || typeof host.appendChild !== 'function') {
        throw new TypeError('vanilla adapter requires an element host');
      }
      const doc = host.ownerDocument;
      const container = doc.createElement('div');
      container.dataset.siteKit = 'navigation-v1';
      const render = next => {
        const nav = doc.createElement('nav');
        nav.setAttribute('aria-label', '共通Coreの経路');
        const parent = doc.createElement('div');
        parent.className = 'core-links';
        for (const item of navigation(next)) {
          const a = doc.createElement('a');
          a.href = item.url;
          a.textContent = item.title; // Never interpret titles/config as HTML.
          if (item.id === currentRouteId) a.setAttribute('aria-current', 'page');
          parent.appendChild(a);
        }
        nav.appendChild(parent);
        const status = doc.createElement('p');
        status.className = 'demo-note';
        status.dataset.coreBreadcrumbs = '';
        status.textContent = breadcrumbs(next, currentRouteId).map(x => x.title).join(' › ');
        container.replaceChildren(nav, status);
      };
      render(definition);
      host.appendChild(container);
      let disposed = false;
      return {
        update(next) {
          if (disposed) throw new Error('vanilla adapter already disposed');
          render(next);
        },
        dispose() {
          if (disposed) return;
          disposed = true;
          container.remove(); // Cleanup only nodes this adapter owns.
        }
      };
    }
  };
}
