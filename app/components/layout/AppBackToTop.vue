<script setup lang="ts">
/**
 * 回到頂部按鈕：捲動超過約兩個畫面高度才出現。
 *
 * - 捲動監聽使用 passive + requestAnimationFrame，不阻塞捲動、每個畫面最多計算一次。
 * - 尊重「減少動態」設定：開啟時直接跳到頂部，不做平滑捲動。
 * - 用鍵盤按下時（event.detail === 0），焦點移到頁面最上方的「跳到主要內容」連結，
 *   鍵盤使用者接下來按 Tab 會從頁首開始，而不是停在頁面底部的按鈕上。滑鼠點擊則不移動焦點。
 * - 不顯示時以 hidden 移出，按鈕不會被 Tab 到。
 */
import { ArrowUp as IconArrowUp } from 'lucide-vue-next'

const visible = ref(false)
let frame = 0

function update() {
  frame = 0
  visible.value = window.scrollY > window.innerHeight * 1.5
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  cancelAnimationFrame(frame)
})

function backToTop(event: MouseEvent) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  if (event.detail === 0) {
    document.querySelector<HTMLElement>('.skip-link')?.focus({ preventScroll: true })
  }
}
</script>

<template>
  <button
    v-show="visible"
    type="button"
    class="back-to-top"
    aria-label="回到頁面頂部"
    @click="backToTop"
  >
    <IconArrowUp :size="20" aria-hidden="true" />
  </button>
</template>

<style scoped lang="scss">
.back-to-top {
  position: fixed;
  right: space(4);
  bottom: calc(#{space(4)} + env(safe-area-inset-bottom));
  z-index: z('header');
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1.5px solid color('border-ink');
  border-radius: radius('full');
  background: color('bg-surface');
  color: color('text-default');
  box-shadow: shadow('sticker');
  cursor: pointer;

  @include bp(md) {
    right: space(6);
    bottom: space(6);
  }

  @include motion-safe {
    transition:
      transform duration('fast'),
      box-shadow duration('fast');
    animation: back-to-top-in duration('base') ease-out;
  }

  &:hover {
    box-shadow: shadow('sticker-hover');
    transform: translateY(-2px);
  }
}

// 詳細頁在手機上有固定的底部預約列（v-show 顯示時沒有 display:none），按鈕往上移避免重疊
:global(html:has(.mobile-cta:not([style*='none'])) .back-to-top) {
  @media (max-width: 1023.98px) {
    bottom: calc(88px + env(safe-area-inset-bottom));
  }
}

@keyframes back-to-top-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
