<script setup lang="ts" generic="K extends string">
/**
 * 分頁標籤，依 WAI-ARIA Tabs 模式實作：
 * - 只有目前的分頁可用 Tab 聚焦（roving tabindex），左右方向鍵切換、Home／End 跳到頭尾。
 * - 每個 tab 以 aria-controls 對應 panel，panel 以 aria-labelledby 對應 tab。
 */
const props = defineProps<{
  tabs: { key: K; label: string; count?: number }[]
  label: string
}>()
const model = defineModel<K>({ required: true })
const baseId = useId()
const tabRefs = ref<HTMLButtonElement[]>([])

const tabId = (key: K) => `${baseId}-tab-${key}`
const panelId = (key: K) => `${baseId}-panel-${key}`

function select(index: number) {
  const tab = props.tabs[index]
  if (!tab) return
  model.value = tab.key
  nextTick(() => tabRefs.value[index]?.focus())
}

function onKeydown(event: KeyboardEvent, index: number) {
  const last = props.tabs.length - 1
  const map: Record<string, number> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }
  const target = map[event.key]
  if (target === undefined) return
  event.preventDefault()
  select(target)
}
</script>

<template>
  <div class="tabs">
    <div class="tabs__list" role="tablist" :aria-label="label">
      <button
        v-for="(tab, index) in tabs"
        :id="tabId(tab.key)"
        :key="tab.key"
        ref="tabRefs"
        type="button"
        role="tab"
        class="tabs__tab"
        :aria-selected="model === tab.key"
        :aria-controls="panelId(tab.key)"
        :tabindex="model === tab.key ? 0 : -1"
        @click="select(index)"
        @keydown="onKeydown($event, index)"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="tabs__count">{{ tab.count }}</span>
      </button>
    </div>
    <div
      :id="panelId(model)"
      role="tabpanel"
      class="tabs__panel"
      :aria-labelledby="tabId(model)"
      tabindex="0"
    >
      <slot :active="model" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  display: flex;
  flex-direction: column;
  gap: space(5);

  &__list {
    display: flex;
    gap: space(1);
    overflow-x: auto;
    border-bottom: 1px solid color('border-subtle');
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: space(2);
    min-height: 44px;
    padding: 0 space(4);
    border: none;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: color('text-muted');
    font-size: rem(15px);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;

    &:hover {
      color: color('text-default');
    }

    &[aria-selected='true'] {
      border-bottom-color: color('action-accent-fg');
      color: color('text-default');
    }
  }

  &__count {
    min-width: 24px;
    padding: 0 space(2);
    border-radius: radius('full');
    background: color('bg-sunken');
    font-family: var(--font-mono);
    font-size: rem(12px);
    text-align: center;
  }

  &__panel:focus-visible {
    outline: 2px solid color('border-focus');
    outline-offset: 4px;
    border-radius: radius('sm');
  }
}
</style>
