/**
 * SSR／ISR 頁面使用 hash 型 CSP，不需要 script-src 'unsafe-inline'（docs/05-security.md C-08、C-08a）。
 *
 * 背景：
 * - nonce 不適合本站：ISR 頁面的 HTML 會被 CDN 快取，所有人拿到同一個 nonce，nonce 就失去意義。
 * - nuxt-security 的 hash 功能只在預先產生（prerender）的頁面啟用。
 *
 * 做法：伺服器渲染時（render:html，早於所有 render:response），計算頁面上「會執行」的內嵌 script
 * （Nuxt 的 window.__NUXT__ 設定、importmap）的 SHA-256，放進 event.context.security.hashes.script；
 * nuxt-security 的 updateCsp 外掛會把它們附加到 script-src。
 * 這兩段內容在同一次部署中每頁都相同，所以 ISR 快取的 HTML 與快取的標頭永遠一致。
 *
 * 不需要 hash 的：type="application/json"（__NUXT_DATA__）與 application/ld+json 是資料，瀏覽器不會執行，CSP 不管。
 */
import { inlineScriptHashes } from '../utils/csp-hashes'

export default defineNitroPlugin((nitroApp) => {
  // 預先產生的頁面由 nuxt-security 自己處理
  if (import.meta.prerender) return

  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const security = (event.context.security ??= {}) as {
      hashes?: { script: Set<string>; style: Set<string> }
    }
    security.hashes ??= { script: new Set(), style: new Set() }
    const parts = [...html.head, ...html.bodyPrepend, ...html.body, ...html.bodyAppend].join('')
    for (const hash of inlineScriptHashes(parts)) security.hashes.script.add(hash)
  })
})
