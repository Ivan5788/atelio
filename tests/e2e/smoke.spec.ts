import { expect, test } from '@playwright/test'

test('home page renders with a single h1 and correct lang', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant-TW')
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page).toHaveTitle(/Atelio/)
})

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: '跳到主要內容' })
  await expect(skip).toBeFocused()
  await skip.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
})

test('security headers are present', async ({ request }) => {
  const response = await request.get('/')
  const headers = response.headers()
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(headers['x-content-type-options']).toBe('nosniff')
})

test('styleguide is not indexable', async ({ request }) => {
  const response = await request.get('/dev/styleguide')
  expect(response.ok()).toBe(true)
  expect(response.headers()['x-robots-tag']).toContain('noindex')
})

test('unknown route shows the 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('找不到這個頁面')
})

test('health endpoint responds without leaking config', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBe(true)
  const body = await response.json()
  expect(body.status).toBe('ok')
  expect(JSON.stringify(body)).not.toMatch(/token|password|secret/i)
})

test('public pages are server-rendered with their main content in the HTML', async ({
  request,
}) => {
  const pages: [string, string][] = [
    ['/workshops', '探索工作坊'],
    ['/workshops/wheel-throwing-basics-taipei', '拉坯入門：做出第一只茶碗'],
    ['/categories/ceramics', '陶藝工作坊'],
    ['/cities/tainan', '台南的手作工作坊'],
    ['/instructors', '陳以禾'],
    ['/instructors/chen-yihe', '土窯工作室'],
    ['/journal', '知識專欄'],
    ['/journal/first-pottery-class-checklist', '指甲剪短'],
    ['/faq', '可以取消預約嗎？'],
    ['/about', '作品聲明'],
    ['/for-organizers', '開課者專區'],
  ]
  for (const [path, text] of pages) {
    const res = await request.get(path)
    expect(res.status(), path).toBe(200)
    expect(await res.text(), path).toContain(text)
  }
})

test('unknown workshop, category and instructor return HTTP 404', async ({ request }) => {
  for (const path of [
    '/workshops/nope',
    '/categories/nope',
    '/cities/nope',
    '/instructors/nope',
    '/journal/nope',
  ]) {
    expect((await request.get(path)).status(), path).toBe(404)
  }
})

test('filtered list pages are not indexable', async ({ page }) => {
  await page.goto('/workshops?category=ceramics')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await page.goto('/workshops')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/)
})
