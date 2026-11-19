import { defineConfig, devices } from '@playwright/test'

// E2E 測試對「建置後的正式版」執行（nuxt build + preview），
// 才能測到 prerender、routeRules 與安全標頭的真實行為。
const PORT = 3100

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npx nuxt preview --port ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      // 正式版建置不會自動產生 Session 加密金鑰；本機測試用固定的假值，CI 由 workflow 傳入隨機值
      NUXT_APP_SECRET: process.env.NUXT_APP_SECRET ?? 'e2e-only-secret-not-used-in-production-000',
      // 所有測試都從同一個 IP 登入，調高上限避免互相觸發限流；正式環境使用預設值
      NUXT_RATE_LIMIT_AUTH_MAX: '1000',
      NUXT_RATE_LIMIT_API_MAX: '10000',
    },
  },
})
