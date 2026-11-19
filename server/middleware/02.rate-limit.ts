/**
 * API 速率限制（docs/05-security.md C-05）：
 * - 登入、註冊、Demo 帳號：每個 IP 每 10 分鐘 10 次（防止暴力破解與大量建立帳號）
 * - 會讀寫資料庫的 API（/api/me、/api/studio、個人化名額）：每個 IP 每分鐘 60 次
 *
 * 為什麼公開的目錄 API（工作坊列表、分類…）不限流：
 * 1. 它們只讀打包在程式裡的 seed 資料，不碰 Redis，不會消耗資料庫額度。
 * 2. 限流本身每次都要查一次 Redis；對這些端點限流，反而是在花額度。
 * 3. 伺服器渲染頁面時會在內部呼叫這些 API，Nuxt 預先載入連結的 payload 時也會；
 *    開發時實測一次瀏覽 8 個頁面就產生約 200 次內部呼叫，若一起計數，正常瀏覽就會被擋。
 * 大量請求公開頁面的防護交給 ISR／CDN 快取與 Vercel 平台的 DDoS 防護。
 *
 * 次數可用環境變數調整（NUXT_RATE_LIMIT_AUTH_MAX、NUXT_RATE_LIMIT_API_MAX），
 * E2E 測試在同一個 IP 上大量登入，會把上限調高；正式環境使用預設值。
 */
const AUTH_PATHS = new Set(['/api/auth/login', '/api/auth/register', '/api/auth/demo'])
const DATA_PATH = /^\/api\/(me|studio)(\/|$)|^\/api\/workshops\/[^/]+\/sessions$/

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0]!
  const isAuth = event.method === 'POST' && AUTH_PATHS.has(path)
  if (!isAuth && !DATA_PATH.test(path)) return

  const { rateLimit } = useRuntimeConfig(event)
  const limiter = isAuth
    ? getRateLimiter('auth', Number(rateLimit.authMax), 600)
    : getRateLimiter('api', Number(rateLimit.apiMax), 60)

  // Vercel 會覆寫 x-forwarded-for，第一個值即為使用者的真實 IP
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const { success, reset } = await limiter.limit(ip)

  if (!success) {
    setResponseHeader(event, 'Retry-After', Math.max(1, Math.ceil((reset - Date.now()) / 1000)))
    throw createError({ statusCode: 429, message: '請求太頻繁，請稍後再試' })
  }
})
