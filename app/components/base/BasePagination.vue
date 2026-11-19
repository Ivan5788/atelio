<script setup lang="ts">
/**
 * 分頁：每一頁都是真正的連結（<a href="?page=2">），
 * 搜尋引擎可以跟著連結爬到後面的頁面，使用者也能在新分頁開啟或分享特定頁碼。
 */
import type { RouteLocationRaw } from 'vue-router'
import { ChevronLeft as IconPrev, ChevronRight as IconNext } from 'lucide-vue-next'

const props = defineProps<{
  page: number
  totalPages: number
  to: (page: number) => RouteLocationRaw
}>()

/** 頁碼視窗：1 … 4 5 [6] 7 8 … 20 */
const pages = computed<(number | 'gap')[]>(() => {
  const { page, totalPages } = props
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  return [
    1,
    ...(start > 2 ? ['gap' as const] : []),
    ...middle,
    ...(end < totalPages - 1 ? ['gap' as const] : []),
    totalPages,
  ]
})
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="分頁">
    <NuxtLink
      v-if="page > 1"
      :to="to(page - 1)"
      class="pagination__item pagination__step"
      aria-label="上一頁"
    >
      <IconPrev :size="18" aria-hidden="true" />
    </NuxtLink>
    <span v-else class="pagination__item pagination__step is-disabled" aria-hidden="true">
      <IconPrev :size="18" />
    </span>

    <template v-for="(item, index) in pages" :key="`${item}-${index}`">
      <span v-if="item === 'gap'" class="pagination__gap" aria-hidden="true">…</span>
      <NuxtLink
        v-else
        :to="to(item)"
        class="pagination__item"
        :class="{ 'is-current': item === page }"
        :aria-current="item === page ? 'page' : undefined"
        :aria-label="`第 ${item} 頁`"
      >
        {{ item }}
      </NuxtLink>
    </template>

    <NuxtLink
      v-if="page < totalPages"
      :to="to(page + 1)"
      class="pagination__item pagination__step"
      aria-label="下一頁"
    >
      <IconNext :size="18" aria-hidden="true" />
    </NuxtLink>
    <span v-else class="pagination__item pagination__step is-disabled" aria-hidden="true">
      <IconNext :size="18" />
    </span>
  </nav>
</template>

<style scoped lang="scss">
.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: space(2);

  &__item {
    display: grid;
    place-items: center;
    min-width: 44px;
    height: 44px;
    padding-inline: space(2);
    border: 1px solid color('border-subtle');
    border-radius: radius('md');
    background: color('bg-surface');
    color: color('text-default');
    font-family: var(--font-mono);
    text-decoration: none;

    &:hover:not(.is-disabled, .is-current) {
      border-color: color('border-ink');
      color: color('text-default');
    }

    &.is-current {
      background: color('bg-inverse');
      border-color: color('bg-inverse');
      color: color('text-inverse');
    }

    &.is-disabled {
      color: color('text-muted');
      background: color('bg-sunken');
    }
  }

  &__step {
    border-color: color('border-strong');
  }

  &__gap {
    display: grid;
    place-items: center;
    width: 24px;
    color: color('text-muted');
  }
}
</style>
