/**
 * API 速率限制（docs/05-security.md C-05）：
 * - 登入、註冊、Demo 帳號：每個 IP 每 10 分鐘 10 次（防止暴力破解與大量建立帳號）
 * - 其他 API：每個 IP 每分鐘 60 次（避免免費額度被耗盡）
 *
 * 次數可用環境變數調整（NUXT_RATE_LIMIT_AUTH_MAX、NUXT_RATE_LIMIT_API_MAX），
 * E2E 測試在同一個 IP 上大量登入，會把上限調高；正式環境使用預設值。
 */
const AUTH_PATHS = new Set(['/api/auth/login', '/api/auth/register', '/api/auth/demo'])

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/') || event.path.startsWith('/api/health')) return

  const { rateLimit } = useRuntimeConfig(event)
  const path = event.path.split('?')[0]!
  const isAuth = event.method === 'POST' && AUTH_PATHS.has(path)
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
