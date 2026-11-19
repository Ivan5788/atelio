<script setup lang="ts">
/**
 * 文字輸入欄位：標籤、說明、錯誤訊息一體化。
 * - label 一定要有（無障礙）；視覺上要隱藏時用 hideLabel，螢幕閱讀器仍會讀出。
 * - 錯誤訊息透過 aria-describedby 與欄位連結，並設定 aria-invalid。
 * - multiline 時渲染 <textarea>。
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    error?: string
    hint?: string
    hideLabel?: boolean
    required?: boolean
    multiline?: boolean
    rows?: number
  }>(),
  { type: 'text', rows: 4 },
)

const model = defineModel<string | number>({ default: '' })
const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement>()

const describedBy = computed(
  () => [props.hint && hintId, props.error && errorId].filter(Boolean).join(' ') || undefined,
)

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<template>
  <div class="field" :class="{ 'field--error': error }">
    <label :for="id" class="field__label" :class="{ 'visually-hidden': hideLabel }">
      {{ label }}<span v-if="required" class="field__required" aria-hidden="true">＊</span>
    </label>
    <div class="field__control">
      <slot name="prefix" />
      <textarea
        v-if="multiline"
        :id="id"
        ref="inputRef"
        v-model="model"
        class="field__input field__input--multiline"
        :rows="rows"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        v-bind="$attrs"
      />
      <input
        v-else
        :id="id"
        ref="inputRef"
        v-model="model"
        class="field__input"
        :type="type"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        v-bind="$attrs"
      />
      <slot name="suffix" />
    </div>
    <p v-if="hint" :id="hintId" class="field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="field__error">{{ error }}</p>
  </div>
</template>

<style scoped lang="scss">
.field {
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
    position: relative;
    display: flex;
    align-items: center;
  }

  &__input {
    width: 100%;
    min-height: 44px;
    padding: space(2) space(3);
    border: 1px solid color('border-strong');
    border-radius: radius('md');
    background: color('bg-surface');
    color: color('text-default');
    font-size: rem(16px); // 小於 16px 時 iOS Safari 聚焦會自動放大畫面

    &::placeholder {
      color: color('text-muted');
    }

    &:hover {
      border-color: color('border-ink');
    }

    &--multiline {
      resize: vertical;
      line-height: 1.6;
    }
  }

  &__hint {
    font-size: rem(13px);
    color: color('text-muted');
  }

  &__error {
    font-size: rem(13px);
    color: color('status-danger-fg');
  }

  &--error .field__input {
    border-color: color('status-danger-fg');
    border-width: 2px;
  }
}
</style>
