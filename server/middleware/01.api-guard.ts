/**
 * 會改變資料的 API 請求（POST/PUT/PATCH/DELETE）的共同檢查（docs/05-security.md C-06、C-11）：
 *
 * 1. Origin 必須是本站：瀏覽器跨站送出的請求一定會帶 Origin 標頭，攻擊者的網站無法偽造成我們的網域，
 *    搭配 SameSite=Lax Cookie 防止 CSRF。
 * 2. 只接受 application/json：HTML <form> 無法送出 JSON，進一步阻擋表單型 CSRF。
 * 3. 請求大小上限 100 KB：nuxt-security 的限制只檢查 POST/PUT/DELETE，不包含 PATCH，這裡統一處理。
 *
 * 檔名的數字前綴決定執行順序：先做不需要資料庫的檢查，再做速率限制（02）。
 */
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const MAX_BODY_BYTES = 100_000

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/') || !MUTATING.has(event.method)) return

  const origin = getRequestHeader(event, 'origin')
  const host = getRequestHost(event, { xForwardedHost: true })
  if (!origin || !isSameHost(origin, host)) {
    throw createError({ statusCode: 403, message: '請求來源不被允許' })
  }

  const length = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (length > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, message: '請求內容過大' })
  }

  // DELETE 與部分 POST（登出、Demo 登入）沒有 body，不檢查 Content-Type
  if (length > 0) {
    const contentType = getRequestHeader(event, 'content-type') ?? ''
    if (!contentType.toLowerCase().startsWith('application/json')) {
      throw createError({ statusCode: 415, message: '只接受 JSON 格式的請求' })
    }
  }
})

function isSameHost(origin: string, host: string): boolean {
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
