<script setup lang="ts">
/**
 * 數量選擇器（人數）。
 * 使用 role="group" + 顯示目前值的 output，加減按鈕在達到上下限時停用。
 * 值的變化以 aria-live 讀出，螢幕閱讀器使用者按下按鈕後能聽到新的數字。
 */
import { Minus as IconMinus, Plus as IconPlus } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{ label: string; min?: number; max?: number; unit?: string }>(),
  {
    min: 1,
    max: 6,
    unit: '位',
  },
)
const model = defineModel<number>({ required: true })
const labelId = useId()

function step(delta: number) {
  model.value = Math.min(props.max, Math.max(props.min, model.value + delta))
}
</script>

<template>
  <div class="quantity" role="group" :aria-labelledby="labelId">
    <span :id="labelId" class="quantity__label">{{ label }}</span>
    <div class="quantity__control">
      <button
        type="button"
        class="quantity__button"
        :aria-label="`減少${label}`"
        :disabled="model <= min"
        @click="step(-1)"
      >
        <IconMinus :size="18" aria-hidden="true" />
      </button>
      <output class="quantity__value" aria-live="polite">{{ model }} {{ unit }}</output>
      <button
        type="button"
        class="quantity__button"
        :aria-label="`增加${label}`"
        :disabled="model >= max"
        @click="step(1)"
      >
        <IconPlus :size="18" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quantity {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: space(4);

  &__label {
    font-size: rem(14px);
    font-weight: 700;
  }

  &__control {
    display: flex;
    align-items: center;
    border: 1px solid color('border-strong');
    border-radius: radius('md');
    background: color('bg-surface');
  }

  &__button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: color('text-default');
    cursor: pointer;

    &:disabled {
      color: color('text-muted');
      background: color('bg-sunken');
      cursor: not-allowed;
    }

    &:first-child {
      border-radius: radius('md') 0 0 radius('md');
    }

    &:last-child {
      border-radius: 0 radius('md') radius('md') 0;
    }
  }

  &__value {
    min-width: 56px;
    font-family: var(--font-mono);
    text-align: center;
  }
}
</style>
