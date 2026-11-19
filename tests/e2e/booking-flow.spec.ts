import { expect, test, type Page } from '@playwright/test'

/**
 * 核心流程（docs/01-PRD.md §6 成功標準、docs/03-user-flow.md Flow 4）：
 * 搜尋 → 篩選 → 詳細頁 → 預約 → 我的預約 → 取消
 */

async function demoLogin(page: Page) {
  await page.goto('/login')
  await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).click()
  await expect(page).toHaveURL(/\/account$/)
}

test('visitor can search, filter, book and cancel a workshop', async ({ page }) => {
  await demoLogin(page)

  // 搜尋 + 篩選：網址同步
  await page.goto('/workshops')
  await page.getByLabel('搜尋關鍵字').fill('陶')
  await expect(page).toHaveURL(/q=%E9%99%B6/)
  const filters = page.locator('#filter-panel')
  if (!(await filters.isVisible())) await page.getByRole('button', { name: /篩選/ }).click()
  await filters.getByRole('radio', { name: '台北' }).check()
  await expect(page).toHaveURL(/city=taipei/)
  await expect(page.getByRole('status').filter({ hasText: '堂工作坊' })).toContainText('2')

  // 進入詳細頁
  await page.getByRole('link', { name: '拉坯入門：做出第一只茶碗' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('拉坯入門：做出第一只茶碗')

  // 選一個有名額、且超過 72 小時的場次（第二個以後的場次至少一週後）
  const panel = page.locator('#booking-panel')
  const sessions = panel.getByRole('radio')
  const count = await sessions.count()
  let picked = false
  for (let i = 1; i < count; i++) {
    if (await sessions.nth(i).isEnabled()) {
      await sessions.nth(i).check()
      picked = true
      break
    }
  }
  expect(picked).toBe(true)
  await panel.getByRole('button', { name: '立即預約' }).click()

  // Step 1
  await expect(page).toHaveURL(/\/booking\/wheel-throwing-basics-taipei/)
  await expect(page.getByRole('heading', { name: '選擇場次與人數' })).toBeVisible()
  await page.getByRole('button', { name: '下一步：聯絡資料' }).click()

  // Step 2：先送出錯誤的電話，確認錯誤訊息與焦點
  // 切換步驟後焦點移到新步驟的標題
  await expect(page.getByRole('heading', { name: '聯絡資料' })).toBeFocused()
  await page.getByLabel('手機號碼').fill('123')
  await page.getByRole('button', { name: '下一步：確認' }).click()
  await expect(page.getByText('請輸入 09 開頭的 10 碼手機號碼')).toBeVisible()
  await expect(page.getByLabel('手機號碼')).toBeFocused()
  await page.getByLabel('手機號碼').fill('0912345678')
  await page.getByRole('button', { name: '下一步：確認' }).click()

  // Step 3
  await expect(page.getByRole('heading', { name: '確認預約內容' })).toBeVisible()
  await page.getByRole('button', { name: '確認預約' }).click()

  await expect(page.getByRole('heading', { name: '預約完成！' })).toBeVisible()
  const bookingId = (await page.locator('dd.mono').first().textContent())?.replace('#', '').trim()
  expect(bookingId).toBeTruthy()

  // 我的預約 → 取消
  await page.getByRole('link', { name: '前往我的預約' }).click()
  const card = page.locator('.booking-card', { hasText: `#${bookingId}` })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: '取消預約' }).click()
  const dialog = page.getByRole('dialog', { name: '確定要取消這筆預約？' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '確定取消' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('tab', { name: /已取消/ }).click()
  await expect(page.locator('.booking-card', { hasText: `#${bookingId}` })).toBeVisible()
})

test('private pages redirect to login and back', async ({ page }) => {
  await page.goto('/account/bookings')
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)account(%2F|\/)bookings/)
  await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).click()
  await expect(page).toHaveURL(/\/account\/bookings$/)
})

test('favorite toggles from the list and appears in account favorites', async ({ page }) => {
  await page.goto('/workshops/watercolor-basics-taipei')
  // 等登入狀態讀取完成（Header 出現「登入」）才互動，確保頁面已 hydrate、按鈕事件已綁定
  await expect(page.getByRole('link', { name: '登入', exact: true })).toBeVisible()
  // 未登入：開啟登入提示
  await page.getByRole('button', { name: '收藏' }).first().click()
  const prompt = page.getByRole('dialog', { name: '登入後即可收藏' })
  await expect(prompt).toBeVisible()
  await prompt.getByRole('button', { name: '一鍵 Demo 登入' }).click()
  await expect(prompt).toBeHidden()

  const favorite = page.locator('.detail__actions').getByRole('button', { name: /收藏/ })
  await favorite.click()
  await expect(favorite).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/account/favorites')
  await expect(page.getByRole('link', { name: '水彩入門：渲染與疊色' })).toBeVisible()
})

test('register form validates with shared schema', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('姓名').fill('測試')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel(/^密碼/).fill('short')
  await page.getByLabel('確認密碼').fill('different')
  await page.getByRole('button', { name: '建立帳號' }).click()
  await expect(page.getByText('Email 格式不正確')).toBeVisible()
  await expect(page.getByText('密碼至少 8 個字元')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeFocused()

  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/^密碼/).fill('atelio2026')
  await page.getByLabel('確認密碼').fill('atelio2026')
  await page.getByRole('button', { name: '建立帳號' }).click()
  await expect(page).toHaveURL(/\/account$/)
})
