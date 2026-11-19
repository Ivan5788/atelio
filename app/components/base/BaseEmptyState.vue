<script setup lang="ts">
/**
 * 空狀態與錯誤狀態共用的版型（docs/03-user-flow.md 狀態對照表）：
 * 說明發生什麼事 + 下一步可以做什麼。tone="error" 時以 role="alert" 讓螢幕閱讀器立即讀出。
 */
import { Inbox as IconInbox, TriangleAlert as IconAlert } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title: string
    description?: string
    tone?: 'empty' | 'error'
    headingLevel?: 2 | 3
  }>(),
  { tone: 'empty', headingLevel: 2 },
)
</script>

<template>
  <div class="empty" :class="`empty--${tone}`" :role="tone === 'error' ? 'alert' : undefined">
    <span class="empty__icon" aria-hidden="true">
      <slot name="icon">
        <IconAlert v-if="tone === 'error'" :size="28" />
        <IconInbox v-else :size="28" />
      </slot>
    </span>
    <component :is="`h${headingLevel}`" class="empty__title">{{ title }}</component>
    <p v-if="description" class="empty__description">{{ description }}</p>
    <div v-if="$slots.default" class="empty__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: space(3);
  padding: space(7) space(5);
  border: 1.5px dashed color('border-dashed');
  border-radius: radius('lg');
  background: color('bg-surface');
  text-align: center;

  &__icon {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: radius('full');
    background: color('bg-ticket');
    color: color('text-default');
  }

  &--error &__icon {
    background: color('status-danger-bg');
    color: color('status-danger-fg');
  }

  &__title {
    @include text('h3');
  }

  &__description {
    max-width: 32em;
    color: color('text-muted');
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: space(3);
    margin-top: space(2);
  }
}
</style>
