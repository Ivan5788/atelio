<script setup lang="ts" generic="T extends string | number">
/**
 * 下拉選單：使用原生 <select>，手機上會叫出系統選擇器，鍵盤與螢幕閱讀器支援最完整。
 */
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label: string
  options: { value: T; label: string }[]
  error?: string
  hideLabel?: boolean
  required?: boolean
  placeholder?: string
  /** 標籤與選單同一列（工具列用） */
  inline?: boolean
}>()

const model = defineModel<T | ''>({ default: '' })
const id = useId()
const errorId = `${id}-error`
const describedBy = computed(() => (props.error ? errorId : undefined))
</script>

<template>
  <div
    class="select-field"
    :class="{ 'select-field--error': error, 'select-field--inline': inline }"
  >
    <label :for="id" class="select-field__label" :class="{ 'visually-hidden': hideLabel }">
      {{ label }}<span v-if="required" class="select-field__required" aria-hidden="true">＊</span>
    </label>
    <select
      :id="id"
      v-model="model"
      class="select-field__control"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      v-bind="$attrs"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" :id="errorId" class="select-field__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.select-field {
  display: flex;
  flex-direction: column;
  gap: space(2);

  &__label {
    font-size: rem(14px);
    font-weight: 700;
  }

  &__required {
    color: color('status-danger-fg');
    margin-left: 2px;
  }

  &__control {
    min-height: 44px;
    padding: 0 space(8) 0 space(3);
    border: 1px solid color('border-strong');
    border-radius: radius('md');
    background-color: color('bg-surface');
    // 自訂箭頭：用 currentColor 的 SVG 背景，避免各瀏覽器預設箭頭不一致
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235d493e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right space(3) center;
    color: color('text-default');
    font-size: rem(16px);
    appearance: none;
    cursor: pointer;

    &:hover {
      border-color: color('border-ink');
    }
  }

  &--inline {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: space(2);

    .select-field__label {
      font-weight: 400;
      color: color('text-muted');
      white-space: nowrap;
    }
  }

  &__error {
    font-size: rem(13px);
    color: color('status-danger-fg');
  }

  &--error .select-field__control {
    border: 2px solid color('status-danger-fg');
  }
}
</style>
