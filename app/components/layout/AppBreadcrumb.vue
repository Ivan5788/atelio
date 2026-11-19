<script setup lang="ts">
/**
 * 麵包屑：二層以上的公開頁面使用（docs/02-sitemap.md §4）。
 * 最後一項是目前頁面，不加連結並標示 aria-current="page"。
 * 同時輸出 BreadcrumbList 結構化資料：畫面上的麵包屑與 JSON-LD 來自同一份資料，不會不一致。
 */
import { breadcrumbNode, graph } from '#shared/utils/structured-data'

const props = defineProps<{ items: { label: string; to?: string }[] }>()

const route = useRoute()
const { siteUrl } = useRuntimeConfig().public

useJsonLd('breadcrumb', () =>
  graph([
    breadcrumbNode(siteUrl, [
      { name: '首頁', path: '/' },
      ...props.items.map((item, index) => ({
        name: item.label,
        // 最後一項（目前頁面）沒有連結，使用目前路徑
        path: index === props.items.length - 1 || !item.to ? route.path : item.to,
      })),
    ]),
  ]),
)
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
