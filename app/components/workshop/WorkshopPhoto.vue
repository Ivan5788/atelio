<script setup lang="ts">
/**
 * 工作坊照片：有照片時輸出響應式 <img>，沒有照片時（Studio 自建工作坊）改用插畫封面。
 *
 * 效能重點：
 * - srcset + sizes：手機只下載 640px 版本，桌機大圖才下載 1280px。
 * - 寫上 width／height：瀏覽器在圖片載入前就知道比例，版面不會跳動（CLS）。
 * - 卡片預設 loading="lazy"；首屏最大的圖（詳細頁主圖）用 eager + fetchpriority="high"，改善 LCP。
 */
import type { CategorySlug, WorkshopImage } from '#shared/types/domain'

withDefaults(
  defineProps<{
    image: WorkshopImage | null
    category: CategorySlug
    sizes?: string
    priority?: boolean
    /** 裝飾用途（旁邊已有標題說明）時傳 true，alt 設為空字串，螢幕閱讀器略過 */
    decorative?: boolean
  }>(),
  { sizes: '(min-width: 1024px) 320px, (min-width: 768px) 45vw, 100vw' },
)
</script>

<template>
  <img
    v-if="image"
    class="photo"
    :src="image.src"
    :srcset="image.srcset"
    :sizes="sizes"
    :alt="decorative ? '' : image.alt"
    width="1280"
    height="800"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : undefined"
    decoding="async"
  />
  <WorkshopCover v-else :category="category" />
</template>

<style scoped lang="scss">
.photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: color('bg-sunken');
}
</style>
