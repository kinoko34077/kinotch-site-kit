import { defineConfig } from '@playwright/test';
const remoteURL = process.env.M0_BASE_URL;
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: { baseURL: remoteURL || 'http://127.0.0.1:4179', viewport: { width: 390, height: 844 }, screenshot: 'only-on-failure' },
  webServer: remoteURL ? undefined : { command: 'npm run dev', url: 'http://127.0.0.1:4179', reuseExistingServer: false, timeout: 60000 },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ],
  reporter: 'list'
});
