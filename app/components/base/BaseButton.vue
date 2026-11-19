<script setup lang="ts">
/**
 * 共用按鈕。規範見 docs/06-design-system.md 6.1 節、Figma 元件 `Button`。
 *
 * - 傳入 `to` 時渲染成 <NuxtLink>（導頁用連結，語意正確、可在新分頁開啟）；
 *   否則渲染成 <button>（執行動作用按鈕）。
 * - loading 時保留原本寬度、設定 aria-busy，並阻擋重複點擊。
 */
import type { RouteLocationRaw } from 'vue-router'

export interface BaseButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  to?: RouteLocationRaw
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  to: undefined,
  disabled: false,
  loading: false,
  block: false,
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const isInactive = computed(() => props.disabled || props.loading)

function onClick(event: MouseEvent) {
  if (isInactive.value) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <NuxtLink
    v-if="to && !isInactive"
    :to="to"
    class="base-button"
    :class="[`base-button--${variant}`, `base-button--${size}`, { 'base-button--block': block }]"
  >
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    class="base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--block': block, 'is-loading': loading },
    ]"
    :disabled="disabled"
    :aria-disabled="loading || undefined"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <span class="base-button__label"><slot /></span>
    <span v-if="loading" class="base-button__spinner" aria-hidden="true" />
    <span v-if="loading" class="visually-hidden">處理中</span>
  </button>
</template>

<style scoped lang="scss">
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: space(2);
  border: 1.5px solid transparent;
  border-radius: radius('full');
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;

  @include focus-ring;
  @include motion-safe {
    transition:
      background-color duration('fast'),
      box-shadow duration('fast'),
      transform duration('fast');
  }

  &:disabled {
    cursor: not-allowed;
  }

  &--block {
    width: 100%;
  }

  // ── 尺寸 ────────────────────────────────────────────
  &--sm {
    min-height: 32px;
    padding-inline: space(3);
    font-size: rem(14px);

    // 手機上的觸控目標至少 44×44px：視覺維持 32px，用偽元素擴大可點擊範圍
    &::after {
      content: '';
      position: absolute;
      inset: -6px 0;
    }
  }

  &--md {
    min-height: 40px;
    padding-inline: space(4);
    font-size: rem(15px);
  }

  &--lg {
    min-height: 48px;
    padding-inline: space(5);
    font-size: rem(16px);
  }

  // ── 變體 ────────────────────────────────────────────
  // 主要按鈕的天空藍與頁面底色很接近，可可色描邊是辨識按鈕的必要元素，不可移除。
  &--primary {
    background: color('action-primary-bg');
    color: color('action-primary-fg');
    border-color: color('action-primary-border');
    box-shadow: shadow('sticker');

    &:hover:not(:disabled) {
      background: color('action-primary-bg-hover');
      box-shadow: shadow('sticker-hover');
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      box-shadow: none;
      transform: translateY(2px);
    }
  }

  &--secondary {
    background: color('bg-surface');
    color: color('text-default');
    border-color: color('border-strong');

    &:hover:not(:disabled) {
      border-color: color('border-ink');
    }
  }

  &--ghost {
    background: transparent;
    color: color('text-default');

    &:hover:not(:disabled) {
      background: color('bg-sunken');
    }
  }

  &--danger {
    background: color('action-danger-bg');
    color: color('action-danger-fg');
  }

  // Disabled 用實色而不是 opacity：opacity 會讓文字對比度無法預測
  &:disabled:not(.is-loading) {
    background: color('bg-sunken');
    color: color('text-muted');
    border-color: color('border-subtle');
    box-shadow: none;
  }

  // ── Loading：文字隱形但保留寬度，避免按鈕跳動 ─────────
  &.is-loading {
    cursor: progress;

    .base-button__label {
      visibility: hidden;
    }
  }

  &__spinner {
    position: absolute;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: base-button-spin 0.8s linear infinite;
  }
}

@keyframes base-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
