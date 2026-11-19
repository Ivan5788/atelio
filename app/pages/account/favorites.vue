<script setup lang="ts">
/**
 * 收藏（F-23）。取消收藏時卡片從清單中移除——這裡沒有額外寫同步邏輯，
 * 是因為列表依 Pinia 收藏狀態過濾，在任何頁面切換收藏都會反映過來。
 */
import type { WorkshopSummary } from '#shared/types/domain'
import { accountService } from '~/services/account.service'
import { toApiError } from '~/services/http'
import { useFavoritesStore } from '~/stores/favorites'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: '我的收藏', robots: 'noindex, nofollow' })

const favorites = useFavoritesStore()
const items = ref<WorkshopSummary[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    items.value = await accountService.listFavorites()
  } catch (e) {
    error.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const visible = computed(() => items.value.filter((w) => favorites.isFavorite(w.slug)))
</script>

<template>
  <AccountShell title="我的收藏">
    <BaseEmptyState v-if="error" tone="error" title="無法載入收藏" :description="error">
      <BaseButton variant="secondary" @click="load">重新載入</BaseButton>
    </BaseEmptyState>

    <ul v-else-if="loading" class="grid" aria-busy="true">
      <li v-for="n in 3" :key="n"><BaseSkeleton height="320px" radius="lg" /></li>
    </ul>

    <BaseEmptyState
      v-else-if="visible.length === 0"
      title="還沒有收藏任何工作坊"
      description="在列表或詳細頁按下愛心，就能把感興趣的課程收在這裡。"
    >
      <BaseButton variant="secondary" to="/workshops">探索工作坊</BaseButton>
    </BaseEmptyState>

    <template v-else>
      <p class="count" role="status">共 {{ visible.length }} 堂</p>
      <ul class="grid">
        <li v-for="workshop in visible" :key="workshop.id">
          <WorkshopCard :workshop="workshop" :heading-level="2" />
        </li>
      </ul>
    </template>
  </AccountShell>
</template>

<style scoped lang="scss">
.count {
  color: color('text-muted');
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: space(5);
}
</style>
