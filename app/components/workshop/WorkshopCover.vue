<script setup lang="ts">
/**
 * 插畫式封面：分類色＋線條圖示。
 * 用在沒有照片的地方（Studio 自建的工作坊、詳細頁的第二格），
 * 不需要下載圖片，同一分類的視覺也一致。
 */
import type { Component } from 'vue'
import { Amphora, Feather, Flower2, Hammer, Palette, Shirt, Stamp, Wallet } from 'lucide-vue-next'
import type { CategorySlug } from '#shared/types/domain'

const props = withDefaults(
  defineProps<{ category: CategorySlug; size?: 'card' | 'hero' | 'thumb' }>(),
  { size: 'card' },
)

const ICONS: Record<CategorySlug, Component> = {
  ceramics: Amphora,
  leathercraft: Wallet,
  floral: Flower2,
  printmaking: Stamp,
  typography: Feather,
  woodworking: Hammer,
  textile: Shirt,
  illustration: Palette,
}

const icon = computed(() => ICONS[props.category])
const iconSize = computed(() => ({ card: 56, hero: 120, thumb: 28 })[props.size])
</script>

<template>
  <div class="cover" :class="[`cover--${category}`, `cover--${size}`]" aria-hidden="true">
    <component :is="icon" :size="iconSize" :stroke-width="1.25" class="cover__icon" />
  </div>
</template>

<style scoped lang="scss">
.cover {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
  color: color('text-default');
  // 手帳紙質感：細點網格
  background-image: radial-gradient(rgb(93 73 62 / 0.12) 1px, transparent 1px);
  background-size: 14px 14px;

  @each $slug
    in (
      'ceramics',
      'leathercraft',
      'floral',
      'printmaking',
      'typography',
      'woodworking',
      'textile',
      'illustration'
    )
  {
    &--#{$slug} {
      background-color: color('category-#{$slug}');
    }
  }

  // 字體分類的底色是深可可色，圖示改用淺色
  &--typography {
    color: color('text-inverse');
    background-image: radial-gradient(rgb(253 255 245 / 0.16) 1px, transparent 1px);
  }

  &__icon {
    opacity: 0.85;
  }

  // 大尺寸時加上一個圓形「貼紙」襯底
  &--hero::before {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    border-radius: radius('full');
    border: 1.5px dashed currentColor;
    opacity: 0.35;
  }
}
</style>
