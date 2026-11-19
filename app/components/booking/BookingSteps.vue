<script setup lang="ts">
/**
 * 預約步驟指示器。目前步驟以 aria-current="step" 標示，
 * 螢幕閱讀器會讀出「第 2 步，共 3 步：聯絡資料，目前步驟」。
 */
import { Check as IconCheck } from 'lucide-vue-next'

defineProps<{ steps: string[]; current: number }>()
</script>

<template>
  <ol class="steps">
    <li
      v-for="(label, index) in steps"
      :key="label"
      class="steps__item"
      :class="{ 'is-done': index < current, 'is-current': index === current }"
      :aria-current="index === current ? 'step' : undefined"
    >
      <span class="steps__marker" aria-hidden="true">
        <IconCheck v-if="index < current" :size="16" />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span class="steps__label">
        <span class="visually-hidden">第 {{ index + 1 }} 步，共 {{ steps.length }} 步：</span
        >{{ label }}
        <span v-if="index < current" class="visually-hidden">（已完成）</span>
      </span>
    </li>
  </ol>
</template>

<style scoped lang="scss">
.steps {
  display: flex;
  gap: space(2);

  &__item {
    display: flex;
    flex: 1;
    align-items: center;
    gap: space(2);
    padding-bottom: space(3);
    border-bottom: 3px solid color('border-subtle');
    color: color('text-muted');
    font-size: rem(14px);

    &.is-current {
      border-color: color('action-accent-fg');
      color: color('text-default');
      font-weight: 700;
    }

    &.is-done {
      border-color: color('border-ink');
      color: color('text-default');
    }
  }

  &__marker {
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1.5px solid currentColor;
    border-radius: radius('full');
    font-family: var(--font-mono);
    font-size: rem(13px);

    .is-current & {
      border-color: color('action-accent-fg');
      background: color('bg-selected');
    }

    .is-done & {
      background: color('bg-inverse');
      border-color: color('bg-inverse');
      color: color('text-inverse');
    }
  }
}
</style>
