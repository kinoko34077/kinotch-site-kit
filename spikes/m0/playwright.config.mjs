import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4179', viewport: { width: 390, height: 844 }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4179', reuseExistingServer: false, timeout: 60000 },
  reporter: 'list'
});
