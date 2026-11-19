/**
 * 登入後的導向網址只允許站內路徑，防止 Open Redirect：
 * 攻擊者若能讓 /login?redirect=https://evil.example 在登入後跳到外站，就能做出可信度很高的釣魚連結。
 */
export function safeRedirect(value: unknown, fallback = '/account'): string {
  if (typeof value !== 'string') return fallback
  // 必須是 / 開頭；排除 //evil.com（協定相對網址）與 /\evil.com（部分瀏覽器視為 //）
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
