import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { waitForHydration } from './support/hydration'

/**
 * 無障礙自動檢測（axe-core，WCAG 2.2 A／AA 規則）。
 * 自動化工具大約只能抓到三到四成的無障礙問題，鍵盤操作另有 keyboard.spec.ts，
 * 螢幕閱讀器的實際體驗仍需人工測試（記錄在 docs/09-dev-log.md）。
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function audit(page: Page, label: string) {
  await waitForHydration(page)
  // 等 Toast、Skeleton 等狀態穩定
  await page.waitForTimeout(500)
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const summary = result.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }))
  expect(summary, `${label} 的無障礙問題`).toEqual([])
}

const PUBLIC_PAGES = [
  '/',
  '/workshops',
  '/workshops?category=ceramics&city=taipei',
  '/workshops/wheel-throwing-basics-taipei',
  '/categories/ceramics',
  '/instructors/chen-yihe',
  '/journal/first-pottery-class-checklist',
  '/faq',
  '/about',
  '/login',
  '/register',
  '/search?q=陶',
  '/this-page-does-not-exist',
]

for (const path of PUBLIC_PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path)
    await audit(page, path)
  })
}

test('axe: logged-in pages and dialogs', async ({ page }) => {
  await page.goto('/login?redirect=/account')
  await waitForHydration(page)
  await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).click()
  // 比對 pathname：登入頁網址 /login?redirect=/account 也以 /account 結尾，用正規表示式會誤判成已登入
  await expect(page).toHaveURL((url) => url.pathname === '/account')

  for (const path of [
    '/account',
    '/account/bookings',
    '/account/favorites',
    '/account/profile',
    '/booking/wheel-throwing-basics-taipei',
    '/studio',
    '/studio/workshops',
    '/studio/workshops/new',
  ]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await audit(page, path)
  }

  // 對話框開啟狀態
  await page.goto('/account/bookings')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '取消預約' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await audit(page, '取消預約對話框')
})

test('axe: form error state', async ({ page }) => {
  await page.goto('/register')
  await waitForHydration(page)
  await page.getByRole('button', { name: '建立帳號' }).click()
  await expect(page.getByText('請輸入姓名')).toBeVisible()
  await audit(page, '註冊表單錯誤狀態')
})
