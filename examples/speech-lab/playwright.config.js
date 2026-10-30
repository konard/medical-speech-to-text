import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.pw.js',
  workers: 1,
  retries: 0,
  timeout: 60000,
  use: {
    baseURL: process.env.SPEECH_LAB_URL || 'http://127.0.0.1:4174',
    headless: true,
    launchOptions: process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] }
      : {},
  },
  webServer: process.env.SPEECH_LAB_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 4174 --strictPort',
        url: 'http://127.0.0.1:4174',
        reuseExistingServer: !process.env.CI,
      },
});
