import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end (UAT) suite. Boots an isolated stack so it never touches your
 * dev servers or data:
 *   API  on :8010 against TEST_DATABASE_URL (rebuilt with `kawika db fresh` first)
 *   Web  on :5180, proxying /api to that API
 */
const API_PORT = 8010
const WEB_PORT = 5180
const WEB_URL = `http://localhost:${WEB_PORT}`

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      name: 'api',
      cwd: '../server',
      command: `.venv/bin/python -m app.cli db --database test fresh --force && .venv/bin/fastapi run app/main.py --host 127.0.0.1 --port ${API_PORT}`,
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        APP_ENV: 'test',
        CLIENT_ORIGINS: WEB_URL,
        ALLOWED_HOSTS: 'localhost,127.0.0.1',
        COOKIE_SECURE: 'false',
        // Many sign-ups/logins come from one IP during the run; the per-account
        // login limit stays at its real value so lockout can be tested.
        LOGIN_IP_LIMIT: '10000',
        REGISTER_IP_LIMIT: '10000',
      },
    },
    {
      name: 'web',
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_PROXY: `http://127.0.0.1:${API_PORT}` },
    },
  ],
})
