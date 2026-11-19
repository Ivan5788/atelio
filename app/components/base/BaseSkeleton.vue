<script setup lang="ts">
/**
 * 載入中的佔位區塊。尺寸與實際內容相同，資料載入後版面不會跳動（避免 CLS）。
 * aria-hidden：螢幕閱讀器改由外層的 aria-busy／狀態文字得知「載入中」。
 */
withDefaults(
  defineProps<{ width?: string; height?: string; radius?: 'sm' | 'md' | 'lg' | 'full' }>(),
  {
    width: '100%',
    height: '1em',
    radius: 'sm',
  },
)
</script>

<template>
  <span
    class="skeleton"
    :class="`skeleton--${radius}`"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<style scoped lang="scss">
.skeleton {
  display: block;
  background: color('bg-sunken');

  @each $r in ('sm', 'md', 'lg', 'full') {
    &--#{$r} {
      border-radius: radius($r);
    }
  }

  @include motion-safe {
    background: linear-gradient(
      90deg,
      var(--palette-paper-200) 0%,
      var(--palette-latte-100) 50%,
      var(--palette-paper-200) 100%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s ease-in-out infinite;
  }
}

@keyframes skeleton-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>
