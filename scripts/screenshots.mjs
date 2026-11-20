/**
 * 產生 README 用的截圖（Phase 7）。
 *
 * 用法：
 *   npm run build
 *   NUXT_APP_SECRET=<任意 32 字元以上字串> PORT=3100 node .output/server/index.mjs   # 另開一個終端機
 *   node scripts/screenshots.mjs
 *
 * 輸出到 docs/screenshots/（JPEG，只截可視範圍，控制檔案大小）。
 */
import { mkdirSync } from 'node:fs'
import { chromium, devices } from '@playwright/test'

const BASE = 'http://localhost:3100'
const OUT = 'docs/screenshots'
mkdirSync(OUT, { recursive: true })

/** 等待 Nuxt 完成 hydration，避免截到尚未互動化的畫面 */
async function ready(page) {
  await page.waitForFunction(() => window.useNuxtApp?.()?.isHydrating === false)
  await page.waitForLoadState('networkidle')
}

async function shot(page, path, name) {
  await page.goto(BASE + path)
  await ready(page)
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 })
  console.log(`✓ ${name}`)
}

const browser = await chromium.launch()

// 桌機
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await desktop.newPage()
await shot(page, '/', 'home')
await shot(page, '/workshops', 'workshops')
await shot(page, '/workshops/wheel-throwing-basics-taipei', 'detail')

// Studio 需要登入：用一鍵 Demo 登入
await page.goto(`${BASE}/login?redirect=/studio`)
await ready(page)
await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).click()
await page.waitForURL((url) => url.pathname === '/studio')
await ready(page)
// 關掉「已登入」通知，等圖表畫完
await page.getByRole('button', { name: '關閉通知' }).first().click()
await page.waitForSelector('canvas')
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/studio.jpg`, type: 'jpeg', quality: 82 })
console.log('✓ studio')

// 手機
const mobile = await browser.newContext({ ...devices['Pixel 7'] })
const mobilePage = await mobile.newPage()
await shot(mobilePage, '/', 'mobile-home')
await shot(mobilePage, '/workshops/wheel-throwing-basics-taipei', 'mobile-detail')

await browser.close()
