import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests against a real backend (CKmellow/Vekro-backend). The Vite dev server proxies /api to
 * VEKRO_API_TARGET (default http://127.0.0.1:8000). Payments use the simulated rail: tests post the
 * provider's callback themselves, the way M-Pesa would.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(process.env.PW_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
      : {}),
  },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium' } }],
  webServer: {
    command: 'npx vite --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
