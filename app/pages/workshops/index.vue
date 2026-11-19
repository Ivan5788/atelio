<script setup lang="ts">
/**
 * 工作坊列表（F-02）。每次請求 SSR（不使用 ISR，因為 ISR 會忽略 query string）。
 *
 * 資料流：URL query → parseFilters → API 參數 → useAsyncData（watch 網址變化重新查詢）。
 * 篩選操作只更新網址，畫面跟著網址走，所以「上一頁」「分享連結」「重新整理」都能還原狀態。
 */
import { SlidersHorizontal as IconFilter, X as IconX } from 'lucide-vue-next'
import { LEVEL_LABELS, SORT_LABELS, SORTS } from '#shared/types/domain'
import { catalogService } from '~/services/catalog.service'
import { CATEGORY_NAMES, CITY_NAMES } from '~/utils/labels'
import {
  DEFAULT_FILTERS,
  hasActiveFilters,
  parseFilters,
  toQuery,
  type WorkshopFilters,
} from '~/utils/workshop-filters'

const route = useRoute()
const filters = computed(() => parseFilters(route.query))
const apiQuery = computed(
  () => ({ ...toQuery(filters.value), pageSize: 12 }) as Record<string, string | number>,
)

const { data, status, error, refresh } = await useAsyncData(
  'workshop-list',
  () => catalogService.listWorkshops(apiQuery.value),
  { watch: [apiQuery] },
)
const { data: categories } = await useAsyncData('categories', () => catalogService.listCategories())

const filtered = computed(() => hasActiveFilters(filters.value))
useSeoMeta({
  title: '探索工作坊',
  description: '依分類、城市、價格、難度與日期篩選全台手作工作坊，查看剩餘名額並線上預約。',
  // 篩選結果組合太多、內容高度重複，不讓搜尋引擎索引，改由分類與城市落地頁承接流量
  robots: () => (filtered.value || filters.value.page > 1 ? 'noindex, follow' : 'index, follow'),
})

function update(patch: Partial<WorkshopFilters>) {
  // 改變篩選條件時回到第 1 頁；replace 避免每勾一個選項就多一筆瀏覽紀錄
  navigateTo({ query: toQuery({ ...filters.value, ...patch, page: 1 }) }, { replace: true })
}

function clearAll() {
  navigateTo(
    { query: toQuery({ ...DEFAULT_FILTERS, sort: filters.value.sort }) },
    { replace: true },
  )
}

const pageLink = (page: number) => ({ query: toQuery({ ...filters.value, page }) })

// 關鍵字：輸入停止 400ms 後才查詢
const keyword = ref(filters.value.q)
watch(
  () => filters.value.q,
  (q) => (keyword.value = q),
)
let debounce: ReturnType<typeof setTimeout> | undefined
watch(keyword, (value) => {
  clearTimeout(debounce)
  if (value.trim() === filters.value.q) return
  debounce = setTimeout(() => update({ q: value }), 400)
})
onBeforeUnmount(() => clearTimeout(debounce))

const chips = computed(() => {
  const f = filters.value
  return [
    ...(f.q ? [{ label: `「${f.q}」`, patch: { q: '' } }] : []),
    ...f.category.map((slug) => ({
      label: CATEGORY_NAMES[slug],
      patch: { category: f.category.filter((c) => c !== slug) },
    })),
    ...(f.city ? [{ label: CITY_NAMES[f.city], patch: { city: '' as const } }] : []),
    ...f.level.map((level) => ({
      label: LEVEL_LABELS[level],
      patch: { level: f.level.filter((l) => l !== level) },
    })),
    ...(f.priceMin !== undefined || f.priceMax !== undefined
      ? [
          {
            label: `NT$ ${f.priceMin ?? 0}–${f.priceMax ?? '∞'}`,
            patch: { priceMin: undefined, priceMax: undefined },
          },
        ]
      : []),
    ...(f.dateFrom ? [{ label: `${f.dateFrom} 之後`, patch: { dateFrom: '' } }] : []),
  ]
})

const sortOptions = SORTS.map((value) => ({ value, label: SORT_LABELS[value] }))
const filterOpen = ref(false)
const resultsRef = ref<HTMLElement>()
</script>

<template>
  <div class="container list-page">
    <AppBreadcrumb :items="[{ label: '探索工作坊' }]" />
    <h1>探索工作坊</h1>

    <div class="toolbar">
      <div class="toolbar__search">
        <label for="list-q" class="visually-hidden">搜尋關鍵字</label>
        <input
          id="list-q"
          v-model="keyword"
          type="search"
          class="toolbar__input"
          placeholder="搜尋課程、講師、地區"
          maxlength="50"
        />
      </div>
      <BaseSelect
        :model-value="filters.sort"
        label="排序"
        :options="sortOptions"
        inline
        class="toolbar__sort"
        @update:model-value="(value) => update({ sort: value as WorkshopFilters['sort'] })"
      />
      <button
        type="button"
        class="toolbar__filter-toggle"
        :aria-expanded="filterOpen"
        aria-controls="filter-panel"
        @click="filterOpen = !filterOpen"
      >
        <IconFilter :size="18" aria-hidden="true" />
        篩選<span v-if="chips.length">（{{ chips.length }}）</span>
      </button>
    </div>

    <div class="list-page__body">
      <aside
        id="filter-panel"
        class="list-page__filters"
        :class="{ 'is-open': filterOpen }"
        aria-label="篩選條件"
      >
        <WorkshopFilterPanel
          :filters="filters"
          :categories="categories ?? undefined"
          @change="update"
          @clear="clearAll"
        />
      </aside>

      <section
        ref="resultsRef"
        class="list-page__results"
        aria-label="搜尋結果"
        :aria-busy="status === 'pending'"
      >
        <div v-if="status === 'pending'" class="progress" aria-hidden="true" />

        <div class="results-bar">
          <div v-if="chips.length" class="chips">
            <span class="chips__label">已選：</span>
            <button
              v-for="chip in chips"
              :key="chip.label"
              type="button"
              class="chips__chip"
              :aria-label="`移除條件：${chip.label}`"
              @click="update(chip.patch)"
            >
              {{ chip.label }}
              <IconX :size="14" aria-hidden="true" />
            </button>
          </div>
          <!-- 結果數量放在結果區右上角；role=status 讓篩選後的新數量被螢幕閱讀器讀出 -->
          <p class="results-bar__count" role="status">
            <template v-if="data"
              >共 <strong>{{ data.total }}</strong> 堂工作坊</template
            >
          </p>
        </div>

        <BaseEmptyState
          v-if="error"
          tone="error"
          title="工作坊列表暫時無法載入"
          description="請檢查網路連線後再試一次。"
        >
          <BaseButton variant="secondary" @click="refresh()">重新載入</BaseButton>
        </BaseEmptyState>

        <ul v-else-if="!data" class="grid">
          <li v-for="n in 6" :key="n" class="skeleton-card">
            <BaseSkeleton height="180px" radius="lg" />
            <BaseSkeleton width="60%" />
            <BaseSkeleton width="90%" height="1.4em" />
          </li>
        </ul>

        <BaseEmptyState
          v-else-if="data.items.length === 0"
          title="沒有符合條件的工作坊"
          description="試著減少篩選條件，或看看熱門分類。"
        >
          <BaseButton variant="secondary" @click="clearAll">清除篩選條件</BaseButton>
          <BaseButton variant="ghost" to="/categories/ceramics">逛逛陶藝課</BaseButton>
        </BaseEmptyState>

        <template v-else>
          <ul class="grid" :class="{ 'is-stale': status === 'pending' }">
            <li v-for="workshop in data.items" :key="workshop.id">
              <WorkshopCard :workshop="workshop" :heading-level="2" />
            </li>
          </ul>
          <BasePagination :page="data.page" :total-pages="data.totalPages" :to="pageLink" />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.list-page {
  display: flex;
  flex-direction: column;
  gap: space(5);
  padding-block: space(5) space(8);

  &__body {
    display: grid;
    gap: space(6);
    align-items: start;

    @include bp(lg) {
      grid-template-columns: 260px minmax(0, 1fr);
    }
  }

  &__filters {
    display: none;
    padding: space(5);
    border: 1px solid color('border-subtle');
    border-radius: radius('lg');
    background: color('bg-surface');

    &.is-open {
      display: block;
    }

    @include bp(lg) {
      display: block;
      position: sticky;
      top: space(4);
    }
  }

  &__results {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: space(5);
    min-width: 0;
  }
}

// 手機／平板：搜尋獨佔一列，排序與篩選按鈕各佔一半寬度並左右對齊
// 桌機：搜尋、排序同一列，中間拉開距離區隔兩組功能（篩選按鈕在桌機隱藏，篩選面板常駐左側）
.toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: space(3);

  @include bp(lg) {
    display: flex;
    gap: space(7);
  }

  &__search {
    grid-column: 1 / -1;

    @include bp(lg) {
      flex: 1;
    }
  }

  &__input {
    width: 100%;
    min-height: 44px;
    padding: 0 space(3);
    border: 1px solid color('border-strong');
    border-radius: radius('md');
    background: color('bg-surface');
    font-size: rem(16px);
  }

  &__sort {
    min-width: 0;

    @include bp(lg) {
      flex: none;
      width: 240px;
    }
  }

  &__filter-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: space(2);
    width: 100%;
    min-height: 44px;
    padding: 0 space(4);
    border: 1px solid color('border-strong');
    border-radius: radius('md');
    background: color('bg-surface');
    color: color('text-default');
    font-size: rem(15px);
    cursor: pointer;

    @include bp(lg) {
      display: none;
    }
  }
}

.results-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: space(3);

  &__count {
    margin-left: auto;
    color: color('text-muted');
    white-space: nowrap;

    strong {
      font-family: var(--font-mono);
      color: color('text-default');
    }
  }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: space(2);

  &__label {
    font-size: rem(14px);
    color: color('text-muted');
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: space(1);
    min-height: 36px;
    padding: 0 space(3);
    border: 1px solid color('action-accent');
    border-radius: radius('full');
    background: color('bg-selected');
    color: color('action-accent-fg');
    font-size: rem(14px);
    cursor: pointer;

    &:hover {
      border-color: color('action-accent-fg');
    }
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: space(5);

  &.is-stale {
    opacity: 0.6;
  }
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: space(3);
}

// 更新中的細進度條：保留舊資料，避免畫面閃爍（docs/03-user-flow.md 狀態對照表）
.progress {
  position: absolute;
  top: -#{space(3)};
  left: 0;
  right: 0;
  height: 3px;
  overflow: hidden;
  border-radius: radius('full');
  background: color('border-subtle');

  &::after {
    content: '';
    display: block;
    width: 30%;
    height: 100%;
    background: color('action-accent-fg');

    @include motion-safe {
      animation: progress 1s ease-in-out infinite;
    }
  }
}

@keyframes progress {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(400%);
  }
}
</style>
