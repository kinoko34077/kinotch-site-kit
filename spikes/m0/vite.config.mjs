import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Both hosts must be emitted by build; otherwise a dev-only React test is insufficient.
export default defineConfig({
  base: './', // portable when hosted under a repository subpath
  build: {
    rollupOptions: {
      input: {
        vanilla: resolve(import.meta.dirname, 'index.html'),
        react: resolve(import.meta.dirname, 'react.html')
      }
    }
  }
});
