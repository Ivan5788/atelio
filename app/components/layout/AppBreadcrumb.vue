<script setup lang="ts">
/**
 * 麵包屑：二層以上的公開頁面使用（docs/02-sitemap.md §4）。
 * 最後一項是目前頁面，不加連結並標示 aria-current="page"。
 * Phase 5 會在這裡一併輸出 BreadcrumbList 結構化資料。
 */
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ items: { label: string; to?: RouteLocationRaw }[] }>()
</script>

<template>
  <nav class="breadcrumb" aria-label="麵包屑">
    <ol class="breadcrumb__list">
      <li class="breadcrumb__item">
        <NuxtLink to="/">首頁</NuxtLink>
      </li>
      <li v-for="(item, index) in items" :key="index" class="breadcrumb__item">
        <span class="breadcrumb__separator" aria-hidden="true">/</span>
        <NuxtLink v-if="item.to && index < items.length - 1" :to="item.to">{{
          item.label
        }}</NuxtLink>
        <span v-else aria-current="page" class="breadcrumb__current">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.breadcrumb {
  font-size: rem(14px);

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: space(1) space(2);
    color: color('text-muted');
  }

  &__item {
    display: flex;
    align-items: center;
    gap: space(2);
    min-width: 0;
  }

  &__current {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 24em;
  }
}
</style>
