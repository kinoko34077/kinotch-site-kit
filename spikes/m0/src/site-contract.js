// The exact same M1 SiteDefinition is consumed by vanilla and React M0 fixtures.
// Still experimental: this is not the final multi-site package or migration.
export function siteInputForPath(pathname) {
  const basePath = pathname.startsWith('/kinotch-site-kit/') ? '/kinotch-site-kit/' : '/';
  return {
    id: 'site-kit-preview', name: 'KiNoTch. Site Kit Preview',
    basePath,
    layout: 'content',
    theme: 'system',
    routes: [
      { id: 'home', path: '/', title: 'Vanilla JS 版' },
      { id: 'react', path: '/react.html', title: 'React 版', parent: 'home' }
    ],
    features: { theme: true, search: false, legal_pages: false }
  };
}
