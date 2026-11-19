<script setup lang="ts">
import { X as IconX } from 'lucide-vue-next'
/**
 * 對話框：使用原生 <dialog> + showModal()。
 * 瀏覽器內建：焦點限制在對話框內、背景內容不可互動（inert）、Esc 關閉、頂層顯示，
 * 比自己用 div 實作焦點陷阱更可靠。這裡另外處理：
 * - 關閉後把焦點還給開啟前的元素（鍵盤使用者不會迷路）
 * - 點背景關閉
 * - 開啟時鎖住頁面捲動（main.scss 的 html:has(dialog[open])）
 */
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    size?: 'sm' | 'md'
    /** 送出中時禁止關閉，避免請求進行到一半被中斷 */
    persistent?: boolean
  }>(),
  { size: 'sm' },
)

const open = defineModel<boolean>('open', { default: false })
const dialogRef = ref<HTMLDialogElement>()
const titleId = useId()
const descId = useId()
let previouslyFocused: HTMLElement | null = null

watch(
  open,
  async (value) => {
    if (!import.meta.client) return
    await nextTick()
    const dialog = dialogRef.value
    if (!dialog) return
    if (value && !dialog.open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      dialog.showModal()
    } else if (!value && dialog.open) {
      dialog.close()
    }
  },
  { immediate: true },
)

function requestClose() {
  if (props.persistent) return
  open.value = false
}

function onCancel(event: Event) {
  // 攔截 Esc 的預設關閉，統一經過 requestClose（persistent 時不關閉）
  event.preventDefault()
  requestClose()
}

function onClose() {
  open.value = false
  previouslyFocused?.focus()
  previouslyFocused = null
}

function onBackdropClick(event: MouseEvent) {
  // 點擊位置是 dialog 本身（不是內容）代表點到背景
  if (event.target === dialogRef.value) requestClose()
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="modal"
    :class="`modal--${size}`"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descId : undefined"
    @cancel="onCancel"
    @close="onClose"
    @click="onBackdropClick"
  >
    <div v-if="open" class="modal__panel">
      <header class="modal__header">
        <h2 :id="titleId" class="modal__title">{{ title }}</h2>
        <button
          type="button"
          class="modal__close"
          aria-label="關閉"
          :disabled="persistent"
          @click="requestClose"
        >
          <IconX :size="20" aria-hidden="true" />
        </button>
      </header>
      <p v-if="description" :id="descId" class="modal__description">{{ description }}</p>
      <div class="modal__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="modal__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.modal {
  width: calc(100% - #{space(6)});
  max-height: calc(100dvh - #{space(6)});
  padding: 0;
  border: 1.5px solid color('border-ink');
  border-radius: radius('lg');
  background: color('bg-surface');
  color: color('text-default');
  box-shadow: shadow('lg');

  &--sm {
    max-width: 440px;
  }

  &--md {
    max-width: 600px;
  }

  &::backdrop {
    background: rgb(93 73 62 / 0.45);
  }

  &[open] {
    @include motion-safe {
      animation: modal-in duration('base') ease-out;
    }
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: space(4);
    padding: space(5);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: space(4);
  }

  &__title {
    @include text('h3');
  }

  &__close {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -10px -10px 0 0;
    border: none;
    border-radius: radius('full');
    background: transparent;
    color: color('text-default');
    cursor: pointer;

    &:hover:not(:disabled) {
      background: color('bg-sunken');
    }
  }

  &__description {
    color: color('text-muted');
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: space(3);
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
