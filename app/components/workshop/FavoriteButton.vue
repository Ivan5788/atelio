<script setup lang="ts">
/**
 * 收藏按鈕（切換按鈕）：aria-pressed 表示目前狀態，螢幕閱讀器會讀出「已按下」。
 * 未登入時開啟登入提示，而不是直接導頁，使用者不會離開正在看的列表。
 * 收藏狀態只在瀏覽器讀取，伺服器渲染時一律顯示未收藏（避免個人資料進入快取）。
 */
import { Heart as IconHeart } from 'lucide-vue-next'
import { useFavoritesStore } from '~/stores/favorites'

const props = withDefaults(
  defineProps<{ slug: string; title: string; variant?: 'icon' | 'labeled' }>(),
  { variant: 'icon' },
)

const favorites = useFavoritesStore()
const { requireLogin } = useAuth()
const pressed = computed(() => favorites.isFavorite(props.slug))

function onClick() {
  requireLogin(() => favorites.toggle(props.slug, props.title))
}
</script>

<template>
  <button
    type="button"
    class="favorite"
    :class="[`favorite--${variant}`, { 'is-pressed': pressed }]"
    :aria-pressed="pressed"
    :aria-label="variant === 'icon' ? `收藏「${title}」` : undefined"
    @click.stop.prevent="onClick"
  >
    <IconHeart :size="variant === 'icon' ? 18 : 16" aria-hidden="true" class="favorite__icon" />
    <span v-if="variant === 'labeled'">{{ pressed ? '已收藏' : '收藏' }}</span>
  </button>
</template>

<style scoped lang="scss">
.favorite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: space(2);
  border: 1px solid transparent;
  color: color('text-default');
  cursor: pointer;

  @include motion-safe {
    transition: transform duration('fast');

    &:active {
      transform: scale(0.92);
    }
  }

  &--icon {
    width: 44px;
    height: 44px;
    border-radius: radius('full');
    background: color('bg-surface');
    box-shadow: shadow('sm');
  }

  &--labeled {
    min-height: 40px;
    padding: 0 space(4);
    border-color: color('border-strong');
    border-radius: radius('full');
    background: color('bg-surface');
    font-size: rem(15px);
    font-weight: 500;
  }

  &.is-pressed {
    color: color('action-accent-fg');

    .favorite__icon {
      fill: color('action-accent');
    }
  }

  &--labeled.is-pressed {
    border-color: color('action-accent');
    background: color('bg-selected');
  }
}
</style>
