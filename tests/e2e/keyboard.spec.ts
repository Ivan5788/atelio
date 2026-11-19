import { expect, test } from '@playwright/test'
import { waitForHydration } from './support/hydration'

/**
 * 只用鍵盤操作（docs/01-PRD.md §6：全流程可僅用鍵盤完成）。
 * 驗證焦點移動、Esc 關閉、焦點歸還等 axe 這類自動化工具測不到的行為。
 */
test.skip(({ isMobile }) => isMobile, '鍵盤操作以桌機版面測試')

test('category menu opens with Enter, closes with Escape and keeps focus on its button', async ({
  page,
}) => {
  await page.goto('/')
  await waitForHydration(page)
  const button = page.getByRole('button', { name: '分類' })
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: '陶藝' }).first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(button).toHaveAttribute('aria-expanded', 'false')
})

test('keyboard-only demo login and booking flow', async ({ page }) => {
  await page.goto('/login')
  await waitForHydration(page)
  await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL((url) => url.pathname === '/account')

  await page.goto('/workshops/watercolor-basics-taipei')
  await waitForHydration(page)
  // 選擇第一個可預約的場次：聚焦到已選的 radio，方向鍵移動到下一個
  const panel = page.locator('#booking-panel')
  const checked = panel.locator('input[type="radio"]:checked')
  await checked.focus()
  await page.keyboard.press('ArrowDown')
  await expect(panel.locator('input[type="radio"]:checked')).toBeFocused()
  // 人數 +1
  await panel.getByRole('button', { name: '增加人數' }).focus()
  await page.keyboard.press('Enter')
  await expect(panel.locator('output').first()).toContainText('2 位')
  await panel.getByRole('button', { name: '立即預約' }).focus()
  await page.keyboard.press('Enter')

  await expect(page.getByRole('heading', { name: '選擇場次與人數' })).toBeVisible()
  await page.getByRole('button', { name: '下一步：聯絡資料' }).focus()
  await page.keyboard.press('Enter')
  // 換步驟後焦點在標題上，按 Tab 依序進入表單
  await expect(page.getByRole('heading', { name: '聯絡資料' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('聯絡人姓名')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('手機號碼')).toBeFocused()
  await page.keyboard.type('0912345678')
  await page.keyboard.press('Enter') // 在表單內按 Enter 送出
  await expect(page.getByRole('heading', { name: '確認預約內容' })).toBeFocused()
  await page.getByRole('button', { name: '確認預約' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: '預約完成！' })).toBeFocused()
})

test('dialog traps focus, closes with Escape and returns focus to the trigger', async ({
  page,
}) => {
  await page.goto('/login?redirect=/account/bookings')
  await waitForHydration(page)
  await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/account/bookings')

  const trigger = page.getByRole('button', { name: '取消預約' }).first()
  await trigger.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: '確定要取消這筆預約？' })
  await expect(dialog).toBeVisible()

  // 原生 <dialog> 的 showModal() 會讓背景變成 inert：連按 Tab，焦點只會在對話框內，
  // 或離開到瀏覽器本身的介面（此時 activeElement 是 body），絕不會落在背景頁面的元素上。
  await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    const where = await dialog.evaluate((el) => {
      const active = document.activeElement
      if (!active || active === document.body) return 'browser-ui'
      return el.contains(active) ? 'dialog' : `background:${active.tagName}`
    })
    expect(where).not.toMatch(/^background/)
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('booking tabs switch with arrow keys (WAI-ARIA tabs pattern)', async ({ page }) => {
  await page.goto('/login?redirect=/account/bookings')
  await waitForHydration(page)
  await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/account/bookings')

  const upcoming = page.getByRole('tab', { name: /即將到來/ })
  await upcoming.focus()
  await page.keyboard.press('ArrowRight')
  const completed = page.getByRole('tab', { name: /已完成/ })
  await expect(completed).toBeFocused()
  await expect(completed).toHaveAttribute('aria-selected', 'true')
  // 只有目前的分頁在 Tab 順序中（roving tabindex）
  await expect(upcoming).toHaveAttribute('tabindex', '-1')
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: /已取消/ })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(upcoming).toBeFocused()
})
