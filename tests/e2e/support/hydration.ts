import type { Page } from '@playwright/test'

/**
 * 等待 Nuxt 完成 hydration（Vue app 掛載到 #__nuxt）。
 * 伺服器渲染的 HTML 一出現就能看到，但事件處理器要等 hydration 後才綁定；
 * 在那之前輸入或點擊，在真實使用者身上也會發生「按了沒反應」，測試則會變得不穩定。
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#__nuxt') as (Element & { __vue_app__?: unknown }) | null
    return Boolean(root?.__vue_app__)
  })
}
