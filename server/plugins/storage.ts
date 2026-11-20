import upstashDriver from 'unstorage/drivers/upstash'

/**
 * 有 Upstash 連線資訊時，把 `data` 儲存區換成 Redis（docs/04-architecture.md ADR-003）。
 *
 * nuxt.config.ts 裡 `data` 預設是 memory，讓專案 clone 下來不需要任何帳號就能執行。
 * 換成 Redis 的判斷放在執行時，而不是建置設定：
 * - 金鑰不會被寫進建置產出（C-10）。
 * - 同時支援 Vercel Marketplace 注入的 KV_REST_API_* 名稱（見 server/utils/redis-env.ts）。
 */
export default defineNitroPlugin(() => {
  const credentials = getRedisCredentials()
  if (!credentials) return

  const storage = useStorage()
  // 不 dispose 記憶體儲存區（裡面沒有資料），unmount 會同步完成，接著立刻掛上 Redis，
  // 所以第一個請求進來前就已經是 Redis。
  void storage.unmount('data', false)
  storage.mount('data', upstashDriver(credentials))
})
