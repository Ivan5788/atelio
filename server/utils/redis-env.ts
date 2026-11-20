/**
 * 讀取 Upstash Redis 的連線資訊。
 *
 * 兩組變數名稱都接受：
 * - `UPSTASH_REDIS_REST_URL`／`UPSTASH_REDIS_REST_TOKEN`：Upstash 官方名稱（手動設定或本機 .env）
 * - `KV_REST_API_URL`／`KV_REST_API_TOKEN`：透過 Vercel Marketplace 連接 Upstash 時自動注入的名稱
 *
 * 在「執行時」讀取，而不是寫進建置設定：金鑰不會被打包進產出，修改環境變數後也不必為了這兩個值重新建置。
 */
export function getRedisCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  return url && token ? { url, token } : null
}
