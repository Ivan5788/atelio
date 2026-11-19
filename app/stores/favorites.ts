/**
 * 收藏狀態（F-23）：列表、詳細頁、會員中心共用同一份資料，
 * 在任何一處切換收藏，其他頁面的愛心會同步更新。
 *
 * 採用「樂觀更新」：先改畫面、再送 API，失敗時還原並提示，讓操作感覺即時。
 */
import { defineStore } from 'pinia'
import { accountService } from '~/services/account.service'
import { toApiError } from '~/services/http'
import { useToastStore } from './toast'

export const useFavoritesStore = defineStore('favorites', () => {
  const slugs = ref<string[]>([])
  const loaded = ref(false)
  const pending = ref<Set<string>>(new Set())

  const isFavorite = (slug: string) => slugs.value.includes(slug)

  async function load() {
    try {
      slugs.value = await accountService.listFavoriteSlugs()
      loaded.value = true
    } catch {
      // 讀不到收藏不影響瀏覽，維持空清單
      slugs.value = []
    }
  }

  function reset() {
    slugs.value = []
    loaded.value = false
  }

  async function toggle(slug: string, title?: string) {
    if (pending.value.has(slug)) return
    const toast = useToastStore()
    const wasFavorite = isFavorite(slug)
    pending.value.add(slug)
    slugs.value = wasFavorite ? slugs.value.filter((s) => s !== slug) : [...slugs.value, slug]

    try {
      if (wasFavorite) await accountService.removeFavorite(slug)
      else await accountService.addFavorite(slug)
      toast.success(wasFavorite ? '已從收藏移除' : `已加入收藏${title ? `：${title}` : ''}`)
    } catch (error) {
      // 失敗：還原畫面上的狀態
      slugs.value = wasFavorite ? [...slugs.value, slug] : slugs.value.filter((s) => s !== slug)
      toast.error(toApiError(error).message)
    } finally {
      pending.value.delete(slug)
    }
  }

  return { slugs, loaded, isFavorite, load, reset, toggle }
})
