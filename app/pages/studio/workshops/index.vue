<script setup lang="ts">
/**
 * Studio 工作坊管理（F-31）：搜尋、狀態篩選、排序、分頁、上架切換、刪除。
 *
 * 上架切換採樂觀更新：先改畫面，API 失敗再還原並提示（docs/03-user-flow.md Flow 3）。
 * 刪除需要在 Modal 中確認。
 */
import type { Paginated, StudioWorkshop } from '#shared/types/domain'
import { formatDate, formatPrice } from '#shared/utils/format'
import { toApiError } from '~/services/http'
import { studioService } from '~/services/studio.service'
import { useToastStore } from '~/stores/toast'
import { CATEGORY_NAMES, CITY_NAMES } from '~/utils/labels'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Studio 我的工作坊', robots: 'noindex, nofollow' })

const toast = useToastStore()
const q = ref('')
const status = ref<'all' | 'published' | 'draft'>('all')
const sort = ref<'updated' | 'title' | 'price' | 'booked'>('updated')
const page = ref(1)
const result = ref<Paginated<StudioWorkshop>>()
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    result.value = await studioService.list({
      q: q.value.trim() || undefined,
      status: status.value,
      sort: sort.value,
      page: page.value,
      pageSize: 10,
    })
  } catch (e) {
    error.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

let debounce: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
watch([status, sort], () => {
  page.value = 1
  load()
})
watch(page, load)
onBeforeUnmount(() => clearTimeout(debounce))

// ── 上架／下架（樂觀更新）──
const toggling = ref(new Set<string>())
async function toggleStatus(item: StudioWorkshop) {
  if (toggling.value.has(item.id)) return
  const previous = item.status
  const next = previous === 'published' ? 'draft' : 'published'
  item.status = next
  toggling.value.add(item.id)
  try {
    await studioService.setStatus(item.id, next)
    toast.success(next === 'published' ? `已上架「${item.title}」` : `已下架「${item.title}」`)
  } catch (e) {
    item.status = previous
    toast.error(`${toApiError(e).message}，已還原狀態`)
  } finally {
    toggling.value.delete(item.id)
  }
}

// ── 刪除 ──
const deleting = ref<StudioWorkshop>()
const deleteBusy = ref(false)
const deleteError = ref('')
const deleteOpen = computed({
  get: () => Boolean(deleting.value),
  set: (open) => {
    if (!open) deleting.value = undefined
  },
})

async function confirmDelete() {
  if (!deleting.value) return
  deleteBusy.value = true
  deleteError.value = ''
  try {
    await studioService.remove(deleting.value.id)
    toast.success(`已刪除「${deleting.value.title}」`)
    deleting.value = undefined
    // 刪掉該頁最後一筆時回到上一頁
    if (result.value && result.value.items.length === 1 && page.value > 1) page.value--
    else await load()
  } catch (e) {
    deleteError.value = toApiError(e).message
  } finally {
    deleteBusy.value = false
  }
}

const statusOptions = [
  { value: 'all' as const, label: '全部狀態' },
  { value: 'published' as const, label: '已上架' },
  { value: 'draft' as const, label: '草稿' },
]
const sortOptions = [
  { value: 'updated' as const, label: '最近更新' },
  { value: 'title' as const, label: '名稱' },
  { value: 'price' as const, label: '價格高到低' },
  { value: 'booked' as const, label: '報名數多到少' },
]
</script>

<template>
  <StudioShell title="我的工作坊">
    <template #actions>
      <BaseButton to="/studio/workshops/new">新增工作坊</BaseButton>
    </template>

    <div class="toolbar">
      <BaseInput
        v-model="q"
        label="搜尋工作坊名稱"
        hide-label
        type="search"
        placeholder="搜尋工作坊名稱"
        class="toolbar__search"
      />
      <BaseSelect v-model="status" label="狀態" hide-label :options="statusOptions" />
      <BaseSelect v-model="sort" label="排序" hide-label :options="sortOptions" />
    </div>

    <BaseEmptyState v-if="error" tone="error" title="無法載入工作坊" :description="error">
      <BaseButton variant="secondary" @click="load">重新載入</BaseButton>
    </BaseEmptyState>

    <div v-else-if="!result" aria-busy="true" class="skeleton-list">
      <BaseSkeleton v-for="n in 3" :key="n" height="64px" radius="md" />
    </div>

    <BaseEmptyState
      v-else-if="result.items.length === 0"
      :title="q || status !== 'all' ? '沒有符合條件的工作坊' : '還沒有任何工作坊'"
      :description="
        q || status !== 'all' ? '試著調整搜尋或狀態篩選。' : '新增第一堂工作坊，開始接受報名。'
      "
    >
      <BaseButton to="/studio/workshops/new">新增工作坊</BaseButton>
    </BaseEmptyState>

    <template v-else>
      <p class="count" role="status">共 {{ result.total }} 堂工作坊</p>
      <div class="table-wrap" tabindex="0" role="region" aria-label="工作坊列表（可左右捲動）">
        <table class="table" :class="{ 'is-loading': loading }">
          <caption class="visually-hidden">
            我的工作坊列表
          </caption>
          <thead>
            <tr>
              <th scope="col">工作坊</th>
              <th scope="col">上架</th>
              <th scope="col" class="num">價格</th>
              <th scope="col" class="num">場次</th>
              <th scope="col" class="num">已報名</th>
              <th scope="col">更新日期</th>
              <th scope="col"><span class="visually-hidden">操作</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in result.items" :key="item.id">
              <th scope="row" class="table__title">
                <span>{{ item.title }}</span>
                <span class="table__meta">
                  {{ CATEGORY_NAMES[item.category] }}・{{ CITY_NAMES[item.city]
                  }}{{ item.district }}
                  <span v-if="item.origin === 'custom'" class="badge">自建</span>
                </span>
              </th>
              <td>
                <button
                  type="button"
                  role="switch"
                  class="switch"
                  :aria-checked="item.status === 'published'"
                  :aria-label="`上架「${item.title}」`"
                  :disabled="toggling.has(item.id)"
                  @click="toggleStatus(item)"
                >
                  <span class="switch__track" aria-hidden="true"
                    ><span class="switch__thumb"
                  /></span>
                  <span class="switch__label">{{
                    item.status === 'published' ? '已上架' : '草稿'
                  }}</span>
                </button>
              </td>
              <td class="num">{{ formatPrice(item.price) }}</td>
              <td class="num">{{ item.sessions.length }}</td>
              <td class="num">{{ item.bookedCount }}</td>
              <td>{{ formatDate(item.updatedAt) }}</td>
              <td class="table__actions">
                <BaseButton size="sm" variant="secondary" :to="`/studio/workshops/${item.id}/edit`">
                  編輯<span class="visually-hidden">「{{ item.title }}」</span>
                </BaseButton>
                <BaseButton size="sm" variant="ghost" @click="deleting = item">
                  刪除<span class="visually-hidden">「{{ item.title }}」</span>
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav v-if="result.totalPages > 1" class="pager" aria-label="分頁">
        <BaseButton size="sm" variant="secondary" :disabled="page <= 1" @click="page--"
          >上一頁</BaseButton
        >
        <span>第 {{ result.page }} / {{ result.totalPages }} 頁</span>
        <BaseButton
          size="sm"
          variant="secondary"
          :disabled="page >= result.totalPages"
          @click="page++"
          >下一頁</BaseButton
        >
      </nav>
    </template>

    <BaseModal
      v-model:open="deleteOpen"
      title="確定要刪除這堂工作坊？"
      description="刪除後無法復原。已報名的學員資料在示範網站中不受影響。"
      :persistent="deleteBusy"
    >
      <p v-if="deleting" class="modal-name">{{ deleting.title }}</p>
      <p v-if="deleteError" class="modal-error" role="alert">{{ deleteError }}</p>
      <template #footer>
        <BaseButton variant="ghost" :disabled="deleteBusy" @click="deleteOpen = false"
          >取消</BaseButton
        >
        <BaseButton variant="danger" :loading="deleteBusy" @click="confirmDelete"
          >確定刪除</BaseButton
        >
      </template>
    </BaseModal>
  </StudioShell>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: space(3);

  &__search {
    flex: 1 1 240px;
  }
}

.count {
  color: color('text-muted');
  font-size: rem(14px);
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: space(2);
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');
}

.table {
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
  font-size: rem(14px);

  &.is-loading {
    opacity: 0.6;
  }

  th,
  td {
    padding: space(3) space(4);
    border-bottom: 1px solid color('border-subtle');
    text-align: left;
    vertical-align: middle;
  }

  thead th {
    background: color('bg-sunken');
    font-weight: 700;
    white-space: nowrap;
  }

  tbody tr:last-child > * {
    border-bottom: none;
  }

  .num {
    font-family: var(--font-mono);
    text-align: right;
  }

  &__title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 220px;
    font-weight: 500;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: space(2);
    font-size: rem(13px);
    font-weight: 400;
    color: color('text-muted');
  }

  &__actions {
    display: flex;
    gap: space(2);
    justify-content: flex-end;
  }
}

.badge {
  padding: 0 space(2);
  border-radius: radius('full');
  background: color('bg-ticket');
  color: color('text-default');
  font-size: rem(12px);
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: space(2);
  min-height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  color: color('text-default');
  cursor: pointer;

  &__track {
    position: relative;
    width: 40px;
    height: 24px;
    border: 1.5px solid color('border-strong');
    border-radius: radius('full');
    background: color('bg-sunken');

    @include motion-safe {
      transition: background-color duration('fast');
    }
  }

  &__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 17px;
    height: 17px;
    border-radius: radius('full');
    background: color('border-strong');

    @include motion-safe {
      transition: transform duration('fast');
    }
  }

  &[aria-checked='true'] &__track {
    border-color: color('status-success-fg');
    background: color('status-success-bg');
  }

  &[aria-checked='true'] &__thumb {
    background: color('status-success-fg');
    transform: translateX(16px);
  }

  &__label {
    font-size: rem(13px);
    white-space: nowrap;
  }

  &:disabled {
    cursor: progress;
  }
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: space(4);
  font-size: rem(14px);
}

.modal-name {
  font-weight: 500;
}

.modal-error {
  padding: space(3);
  border-radius: radius('md');
  background: color('status-danger-bg');
  color: color('status-danger-fg');
  font-size: rem(14px);
}
</style>
