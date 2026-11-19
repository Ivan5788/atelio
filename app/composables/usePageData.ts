/**
 * 詳細頁共用的資料讀取：資料不存在時回傳真正的 HTTP 404。
 *
 * 為什麼需要這層：Nuxt 4 的 useAsyncData 會把 handler 裡丟出的錯誤收進 `error`，
 * 不會中斷渲染。若只在 handler 裡 throw createError(404)，頁面會以 HTTP 200 回傳一個空白頁，
 * 搜尋引擎會把它當成正常頁面收錄（E2E 測試抓到的問題）。
 * 所以在 await 之後檢查 error，再以 fatal 錯誤中斷渲染，交給 error.vue 並回傳正確的狀態碼。
 */
export async function usePageData<T>(
  key: string,
  handler: () => Promise<T>,
  notFoundMessage: string,
) {
  const { data, error } = await useAsyncData(key, handler)
  if (error.value) {
    const statusCode = (error.value as { statusCode?: number }).statusCode ?? 500
    throw createError({
      statusCode,
      statusMessage: statusCode === 404 ? notFoundMessage : '頁面暫時無法載入',
      fatal: true,
    })
  }
  return data as Ref<T>
}
