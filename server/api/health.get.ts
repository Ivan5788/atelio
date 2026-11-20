/**
 * 健康檢查：部署後確認 API 與資料儲存是否正常。
 * 只回傳「是否可用」與儲存類型，不回傳任何連線資訊或環境變數。
 */
export default defineEventHandler(async () => {
  // 只做讀取：公開端點若每次都寫入，會被拿來灌爆資料庫的寫入額度
  const storageOk = await useStorage('data')
    .hasItem('health:ping')
    .then(() => true)
    .catch(() => false)

  return {
    status: storageOk ? 'ok' : 'degraded',
    storage: getRedisCredentials() ? 'upstash' : 'memory',
    time: new Date().toISOString(),
  }
})
