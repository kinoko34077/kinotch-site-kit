import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Both hosts must be emitted by build; otherwise a dev-only React test is insufficient.
export default defineConfig({
  resolve: {
    alias: {
      // Feature sources live outside the demo root: resolve the optional peer from
      // this fixture's pinned dependency without adding it to other consumers.
      i18next: resolve(import.meta.dirname, 'node_modules/i18next/dist/esm/i18next.js')
    }
  },
  base: './', // portable when hosted under a repository subpath
  server: { fs: { allow: [resolve(import.meta.dirname, '../..')] } }, // explicit repository-local M1 core/adapters
  build: {
    rollupOptions: {
      input: {
        vanilla: resolve(import.meta.dirname, 'index.html'),
        react: resolve(import.meta.dirname, 'react.html'),
        notFound: resolve(import.meta.dirname, '404.html')
      }
    }
  }
});
