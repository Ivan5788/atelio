/**
 * 登入狀態確定後載入收藏；登出時清空。
 * 只在瀏覽器執行：收藏是個人資料，不能出現在會被 CDN 快取的 HTML 裡。
 */
import { useFavoritesStore } from '~/stores/favorites'

export default defineNuxtPlugin(() => {
  const { loggedIn } = useUserSession()
  const favorites = useFavoritesStore()

  watch(
    loggedIn,
    (value) => {
      if (value && !favorites.loaded) favorites.load()
      if (!value) favorites.reset()
    },
    { immediate: true },
  )
})
