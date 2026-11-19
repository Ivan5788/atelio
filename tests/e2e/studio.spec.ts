import { expect, test } from '@playwright/test'
import { waitForHydration } from './support/hydration'

/**
 * 後台流程（docs/01-PRD.md §6）：新增工作坊 → 編輯 → 下架 → 刪除
 */
test('organizer can create, edit, unpublish and delete a workshop', async ({ page }) => {
  await page.goto('/login?redirect=/studio')
  await waitForHydration(page)
  await page.getByRole('button', { name: '一鍵 Demo 登入（免註冊）' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/studio')
  await expect(page.getByRole('heading', { name: '數據總覽' })).toBeVisible()
  await expect(page.getByText('本月報名')).toBeVisible()
  await expect(page.locator('canvas').first()).toBeVisible()

  // 新增：先直接送出，確認錯誤摘要
  await page.goto('/studio/workshops/new')
  await page.getByRole('button', { name: '儲存並上架' }).click()
  await expect(page.getByRole('alert').filter({ hasText: '個欄位需要修正' })).toBeVisible()

  const title = `E2E 測試工作坊 ${Date.now().toString(36)}`
  await page.getByLabel('工作坊名稱').fill(title)
  await page.getByRole('combobox', { name: '分類' }).selectOption('woodworking')
  await page.getByRole('combobox', { name: '城市' }).selectOption('tainan')
  await page.getByLabel('行政區').fill('中西區')
  await page.getByLabel('一句話摘要').fill('用手工具做一個小木盒，適合第一次接觸木工的人。')
  await page
    .getByLabel('課程介紹')
    .fill(
      '課程從工具安全開始，練習鋸切、鑿刀與打磨，最後組裝成一個可以收納小物的木盒，作品當天帶回。',
    )
  const future = new Date(Date.now() + 14 * 86_400_000)
  const local = `${future.toISOString().slice(0, 10)}T14:00`
  await page.locator('#session-0').fill(local)
  await page.getByLabel('每人價格（NT$）').fill('1800')
  await page.getByRole('button', { name: '儲存並上架' }).click()

  await expect(page).toHaveURL(/\/studio\/workshops$/)
  const row = page.getByRole('row').filter({ hasText: title })
  await expect(row).toBeVisible()

  // 編輯
  await row.getByRole('link', { name: /編輯/ }).click()
  await expect(page.getByLabel('工作坊名稱')).toHaveValue(title)
  await page.getByLabel('每人價格（NT$）').fill('2000')
  await page.getByRole('button', { name: '儲存並上架' }).click()
  await expect(page).toHaveURL(/\/studio\/workshops$/)
  await expect(page.getByRole('row').filter({ hasText: title })).toContainText('NT$ 2,000')

  // 下架
  const toggle = page.getByRole('switch', { name: `上架「${title}」` })
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')

  // 刪除
  await page
    .getByRole('row')
    .filter({ hasText: title })
    .getByRole('button', { name: /刪除/ })
    .click()
  const dialog = page.getByRole('dialog', { name: '確定要刪除這堂工作坊？' })
  await dialog.getByRole('button', { name: '確定刪除' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0)
})
