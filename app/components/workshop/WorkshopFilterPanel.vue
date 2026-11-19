<script setup lang="ts">
/**
 * 列表篩選面板。每個群組用 <fieldset> + <legend>，螢幕閱讀器會讀出「分類，群組」。
 * 勾選後立即套用（更新網址）；價格在離開欄位或按 Enter 時才套用，避免每打一個字就重新查詢。
 */
import { CATEGORY_SLUGS, CITY_SLUGS, LEVEL_LABELS, LEVELS } from '#shared/types/domain'
import type { Category } from '#shared/types/domain'
import { CATEGORY_NAMES, CITY_NAMES } from '~/utils/labels'
import type { WorkshopFilters } from '~/utils/workshop-filters'

const props = defineProps<{ filters: WorkshopFilters; categories?: Category[] }>()
const emit = defineEmits<{ change: [patch: Partial<WorkshopFilters>]; clear: [] }>()

const counts = computed(
  () => new Map((props.categories ?? []).map((c) => [c.slug, c.workshopCount])),
)

const priceMin = ref(props.filters.priceMin?.toString() ?? '')
const priceMax = ref(props.filters.priceMax?.toString() ?? '')
watch(
  () => [props.filters.priceMin, props.filters.priceMax],
  ([min, max]) => {
    priceMin.value = min?.toString() ?? ''
    priceMax.value = max?.toString() ?? ''
  },
)

const priceError = computed(() => {
  const min = priceMin.value === '' ? undefined : Number(priceMin.value)
  const max = priceMax.value === '' ? undefined : Number(priceMax.value)
  if ((min !== undefined && min < 0) || (max !== undefined && max < 0)) return '價格不可小於 0'
  if (min !== undefined && max !== undefined && min > max) return '最低價不可高於最高價'
  return ''
})

function applyPrice() {
  if (priceError.value) return
  const toNumber = (v: string) => (v === '' ? undefined : Math.round(Number(v)))
  emit('change', { priceMin: toNumber(priceMin.value), priceMax: toNumber(priceMax.value) })
}

function toggle<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}
</script>

<template>
  <div class="filters">
    <div class="filters__head">
      <h2 class="filters__title">篩選</h2>
      <button type="button" class="filters__clear" @click="emit('clear')">清除全部</button>
    </div>

    <fieldset class="filters__group">
      <legend class="filters__legend">分類</legend>
      <label v-for="slug in CATEGORY_SLUGS" :key="slug" class="filters__option">
        <input
          type="checkbox"
          :checked="filters.category.includes(slug)"
          @change="emit('change', { category: toggle(filters.category, slug) })"
        />
        <span class="filters__label">{{ CATEGORY_NAMES[slug] }}</span>
        <span v-if="counts.has(slug)" class="filters__count">{{ counts.get(slug) }}</span>
      </label>
    </fieldset>

    <fieldset class="filters__group">
      <legend class="filters__legend">城市</legend>
      <label class="filters__option">
        <input
          type="radio"
          name="filter-city"
          :checked="!filters.city"
          @change="emit('change', { city: '' })"
        />
        <span class="filters__label">全部</span>
      </label>
      <label v-for="slug in CITY_SLUGS" :key="slug" class="filters__option">
        <input
          type="radio"
          name="filter-city"
          :checked="filters.city === slug"
          @change="emit('change', { city: slug })"
        />
        <span class="filters__label">{{ CITY_NAMES[slug] }}</span>
      </label>
    </fieldset>

    <fieldset class="filters__group">
      <legend class="filters__legend">價格（NT$）</legend>
      <div class="filters__price">
        <label for="filter-price-min" class="visually-hidden">最低價</label>
        <input
          id="filter-price-min"
          v-model="priceMin"
          type="number"
          inputmode="numeric"
          min="0"
          step="100"
          placeholder="最低"
          class="filters__number"
          :aria-invalid="priceError ? 'true' : undefined"
          aria-describedby="filter-price-error"
          @change="applyPrice"
          @keydown.enter.prevent="applyPrice"
        />
        <span aria-hidden="true">—</span>
        <label for="filter-price-max" class="visually-hidden">最高價</label>
        <input
          id="filter-price-max"
          v-model="priceMax"
          type="number"
          inputmode="numeric"
          min="0"
          step="100"
          placeholder="最高"
          class="filters__number"
          :aria-invalid="priceError ? 'true' : undefined"
          aria-describedby="filter-price-error"
          @change="applyPrice"
          @keydown.enter.prevent="applyPrice"
        />
      </div>
      <p id="filter-price-error" class="filters__error" aria-live="polite">{{ priceError }}</p>
    </fieldset>

    <fieldset class="filters__group">
      <legend class="filters__legend">難度</legend>
      <label v-for="level in LEVELS" :key="level" class="filters__option">
        <input
          type="checkbox"
          :checked="filters.level.includes(level)"
          @change="emit('change', { level: toggle(filters.level, level) })"
        />
        <span class="filters__label">{{ LEVEL_LABELS[level] }}</span>
      </label>
    </fieldset>

    <fieldset class="filters__group">
      <legend class="filters__legend">開課日期</legend>
      <label for="filter-date" class="filters__hint">從這天之後有名額</label>
      <input
        id="filter-date"
        type="date"
        class="filters__number"
        :value="filters.dateFrom"
        @change="emit('change', { dateFrom: ($event.target as HTMLInputElement).value })"
      />
    </fieldset>
  </div>
</template>

<style scoped lang="scss">
.filters {
  display: flex;
  flex-direction: column;
  gap: space(5);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-family: var(--font-body);
    font-size: rem(16px);
    font-weight: 700;
  }

  &__clear {
    min-height: 44px;
    padding: 0;
    border: none;
    background: transparent;
    color: color('text-link');
    font-size: rem(14px);
    cursor: pointer;

    &:hover {
      color: color('text-link-hover');
      text-decoration: underline;
    }
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: space(1);
    margin: 0;
    padding: 0;
    border: none;
  }

  &__legend {
    margin-bottom: space(2);
    font-size: rem(14px);
    font-weight: 700;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: space(3);
    min-height: 36px;
    font-size: rem(15px);
    cursor: pointer;

    input {
      width: 18px;
      height: 18px;
      accent-color: var(--palette-blush-800);
      cursor: pointer;
    }
  }

  &__label {
    flex: 1;
  }

  &__count {
    font-family: var(--font-mono);
    font-size: rem(12px);
    color: color('text-muted');
  }

  &__price {
    display: flex;
    align-items: center;
    gap: space(2);
  }

  &__number {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    padding: 0 space(3);
    border: 1px solid color('border-strong');
    border-radius: radius('md');
    background: color('bg-surface');
    color: color('text-default');
    font-family: var(--font-mono);
    font-size: rem(16px);

    &[aria-invalid='true'] {
      border: 2px solid color('status-danger-fg');
    }
  }

  &__error {
    min-height: 1.2em;
    font-size: rem(13px);
    color: color('status-danger-fg');
  }

  &__hint {
    font-size: rem(13px);
    color: color('text-muted');
  }
}
</style>
