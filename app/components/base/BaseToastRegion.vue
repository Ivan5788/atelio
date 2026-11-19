<script setup lang="ts">
/**
 * Toast 顯示區域，放在 app.vue，全站只有一個。
 * - 區域本身一開始就存在於 DOM（aria-live 區域必須先存在，之後插入的內容才會被讀出）。
 * - 成功／資訊用 polite（不打斷），錯誤用 assertive（立即讀出）。
 * - 滑鼠移入或聚焦時暫停倒數；可用關閉按鈕手動關閉。
 */
import { storeToRefs } from 'pinia'
import {
  CircleCheck as IconCircleCheck,
  Info as IconInfo,
  TriangleAlert as IconTriangleAlert,
  X as IconX,
} from 'lucide-vue-next'
import { TOAST_DURATION_MS, useToastStore, type Toast } from '~/stores/toast'

const store = useToastStore()
const { items } = storeToRefs(store)
const paused = ref(false)
const timers = new Map<
  number,
  { remaining: number; start: number; handle?: ReturnType<typeof setTimeout> }
>()

function schedule(toast: Toast) {
  const timer = timers.get(toast.id) ?? { remaining: TOAST_DURATION_MS, start: 0 }
  timer.start = Date.now()
  timer.handle = setTimeout(() => store.dismiss(toast.id), timer.remaining)
  timers.set(toast.id, timer)
}

watch(
  items,
  (list) => {
    for (const toast of list) if (!timers.has(toast.id) && !paused.value) schedule(toast)
    for (const id of timers.keys())
      if (!list.some((t) => t.id === id)) {
        clearTimeout(timers.get(id)?.handle)
        timers.delete(id)
      }
  },
  { deep: true },
)

function pause() {
  paused.value = true
  for (const timer of timers.values()) {
    clearTimeout(timer.handle)
    timer.remaining -= Date.now() - timer.start
  }
}

function resume() {
  paused.value = false
  for (const toast of items.value) schedule(toast)
}

onBeforeUnmount(() => timers.forEach((t) => clearTimeout(t.handle)))

const politeItems = computed(() => items.value.filter((t) => t.tone !== 'error'))
const alertItems = computed(() => items.value.filter((t) => t.tone === 'error'))
</script>

<template>
  <div class="toasts" @mouseenter="pause" @mouseleave="resume" @focusin="pause" @focusout="resume">
    <div role="status" aria-live="polite" class="toasts__group">
      <div
        v-for="toast in politeItems"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.tone}`"
      >
        <IconCircleCheck v-if="toast.tone === 'success'" :size="20" aria-hidden="true" />
        <IconInfo v-else :size="20" aria-hidden="true" />
        <span class="toast__message">{{ toast.message }}</span>
        <button
          type="button"
          class="toast__close"
          aria-label="關閉通知"
          @click="store.dismiss(toast.id)"
        >
          <IconX :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>
    <div role="alert" aria-live="assertive" class="toasts__group">
      <div v-for="toast in alertItems" :key="toast.id" class="toast toast--error">
        <IconTriangleAlert :size="20" aria-hidden="true" />
        <span class="toast__message">{{ toast.message }}</span>
        <button
          type="button"
          class="toast__close"
          aria-label="關閉通知"
          @click="store.dismiss(toast.id)"
        >
          <IconX :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.toasts {
  position: fixed;
  inset: auto space(4) space(4) space(4);
  z-index: z('toast');
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: space(2);
  pointer-events: none;

  @include bp(md) {
    inset: auto space(6) space(6) auto;
    align-items: flex-end;
  }

  &__group {
    display: contents;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: space(3);
  width: 100%;
  max-width: 400px;
  padding: space(3) space(2) space(3) space(4);
  border: 1.5px solid color('border-ink');
  border-radius: radius('md');
  background: color('bg-surface');
  color: color('text-default');
  box-shadow: shadow('md');
  pointer-events: auto;

  @include motion-safe {
    animation: toast-in duration('base') ease-out;
  }

  &--success svg:first-child {
    color: color('status-success-fg');
  }

  &--info svg:first-child {
    color: color('status-info-fg');
  }

  &--error {
    background: color('status-danger-bg');

    svg:first-child {
      color: color('status-danger-fg');
    }
  }

  &__message {
    flex: 1;
    font-size: rem(15px);
  }

  &__close {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: radius('full');
    background: transparent;
    color: color('text-default');
    cursor: pointer;

    &:hover {
      background: color('bg-sunken');
    }
  }
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
