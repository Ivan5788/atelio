<script setup lang="ts">
/**
 * 新增／編輯工作坊表單（F-32）：基本資訊、內容、場次（可動態新增刪除）、價格與名額。
 *
 * - 使用與 API 相同的 studioWorkshopSchema 驗證；送出失敗時顯示錯誤摘要並聚焦第一個錯誤欄位。
 * - 場次時間輸入使用 datetime-local（沒有時區），一律視為台北時間，轉成 +08:00 的 ISO 字串送出。
 * - 有未儲存的變更時，離開頁面（站內換頁或關閉分頁）會先確認。
 */
import { Plus as IconPlus, Trash2 as IconTrash } from 'lucide-vue-next'
import {
  CATEGORY_SLUGS,
  CITY_SLUGS,
  LEVEL_LABELS,
  LEVELS,
  type StudioWorkshop,
  type WorkshopStatus,
} from '#shared/types/domain'
import { studioWorkshopSchema, type StudioWorkshopInput } from '#shared/schemas'
import { toTaipeiParts } from '#shared/utils/format'
import { CATEGORY_NAMES, CITY_NAMES } from '~/utils/labels'

const props = defineProps<{ initial?: StudioWorkshop; submitting: boolean }>()
const emit = defineEmits<{ submit: [input: StudioWorkshopInput] }>()

const pad = (n: number) => String(n).padStart(2, '0')
/** ISO → datetime-local 的值（台北時間） */
function toLocal(iso: string) {
  if (!iso) return ''
  const p = toTaipeiParts(iso)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}
/** datetime-local 的值 → ISO（視為台北時間） */
const fromLocal = (value: string) => (value ? `${value}:00+08:00` : '')

const form = useZodForm(studioWorkshopSchema, {
  title: props.initial?.title ?? '',
  category: props.initial?.category ?? ('' as never),
  city: props.initial?.city ?? ('' as never),
  district: props.initial?.district ?? '',
  level: props.initial?.level ?? 'beginner',
  summary: props.initial?.summary ?? '',
  description: props.initial?.description ?? '',
  price: props.initial?.price ?? '',
  durationMinutes: props.initial?.durationMinutes ?? 120,
  capacityPerSession: props.initial?.capacityPerSession ?? 6,
  sessions: props.initial?.sessions.map((s) => ({ id: s.id, startsAt: s.startsAt })) ?? [
    { startsAt: '' },
  ],
  status: props.initial?.status ?? 'draft',
})
const v = form.values
// 數字欄位的 schema 使用 z.coerce（輸入型別為 unknown），模板綁定時以同一個 reactive 物件的具體型別存取
const numbers = v as unknown as Record<
  'price' | 'durationMinutes' | 'capacityPerSession',
  string | number
>

// ── 場次 ──
const sessionInputs = ref<HTMLInputElement[]>([])
function addSession() {
  v.sessions = [...v.sessions, { startsAt: '' }]
  nextTick(() => sessionInputs.value.at(-1)?.focus())
}
function removeSession(index: number) {
  v.sessions = v.sessions.filter((_, i) => i !== index)
  nextTick(() => sessionInputs.value[Math.max(0, index - 1)]?.focus())
}
function setSession(index: number, value: string) {
  v.sessions = v.sessions.map((s, i) => (i === index ? { ...s, startsAt: fromLocal(value) } : s))
  form.validateField(`sessions.${index}.startsAt`)
}

// ── 未儲存變更 ──
const snapshot = () => JSON.stringify(v)
const saved = ref(snapshot())
const dirty = computed(() => snapshot() !== saved.value)

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('有尚未儲存的變更，確定要離開嗎？')) return false
})

// ── 送出 ──
const errorCount = computed(() => Object.keys(form.errors.value).length)
const showSummary = ref(false)

function submit(status: WorkshopStatus) {
  v.status = status
  const input = form.validateAll()
  showSummary.value = !input
  if (!input) return
  emit('submit', input)
}

/** 父元件儲存成功後呼叫，清除「未儲存」狀態，才不會在導頁時跳出確認 */
function markSaved() {
  saved.value = snapshot()
}

defineExpose({ markSaved, setServerErrors: form.setServerErrors })

const categoryOptions = CATEGORY_SLUGS.map((value) => ({ value, label: CATEGORY_NAMES[value] }))
const cityOptions = CITY_SLUGS.map((value) => ({ value, label: CITY_NAMES[value] }))
const levelOptions = LEVELS.map((value) => ({ value, label: LEVEL_LABELS[value] }))
</script>

<template>
  <form class="wform" novalidate @submit.prevent="submit('published')">
    <div v-if="showSummary && errorCount" class="wform__summary" role="alert">
      有 {{ errorCount }} 個欄位需要修正，請檢查標示為紅色的欄位。
    </div>

    <section class="wform__section" role="group" aria-labelledby="wform-s1">
      <h2 id="wform-s1" class="wform__legend">基本資訊</h2>
      <BaseInput
        v-model="v.title"
        v-bind="form.field('title')"
        label="工作坊名稱"
        maxlength="40"
        hint="4–40 個字"
        required
      />
      <div class="wform__grid">
        <BaseSelect
          v-model="v.category"
          label="分類"
          :options="categoryOptions"
          placeholder="請選擇分類"
          :error="form.errors.value.category"
          required
          @change="form.validateField('category')"
        />
        <BaseSelect
          v-model="v.level"
          label="難度"
          :options="levelOptions"
          :error="form.errors.value.level"
          required
        />
        <BaseSelect
          v-model="v.city"
          label="城市"
          :options="cityOptions"
          placeholder="請選擇城市"
          :error="form.errors.value.city"
          required
          @change="form.validateField('city')"
        />
        <BaseInput
          v-model="v.district"
          v-bind="form.field('district')"
          label="行政區"
          placeholder="例如：大安區"
          required
        />
      </div>
    </section>

    <section class="wform__section" role="group" aria-labelledby="wform-s2">
      <h2 id="wform-s2" class="wform__legend">課程內容</h2>
      <BaseInput
        v-model="v.summary"
        v-bind="form.field('summary')"
        label="一句話摘要"
        maxlength="80"
        hint="顯示在列表卡片與搜尋結果，10–80 個字"
        required
      />
      <BaseInput
        v-model="v.description"
        v-bind="form.field('description')"
        label="課程介紹"
        multiline
        :rows="6"
        maxlength="2000"
        :hint="`至少 30 個字（目前 ${String(v.description ?? '').length} 字）`"
        required
      />
    </section>

    <section class="wform__section" role="group" aria-labelledby="wform-s3">
      <h2 id="wform-s3" class="wform__legend">場次</h2>
      <p class="wform__hint">時間以台北時間（UTC+8）為準，最多 12 個場次。</p>
      <ol class="sessions">
        <li
          v-for="(session, index) in v.sessions"
          :key="session.id ?? `new-${index}`"
          class="sessions__item"
        >
          <div class="sessions__field">
            <label :for="`session-${index}`" class="sessions__label">場次 {{ index + 1 }}</label>
            <input
              :id="`session-${index}`"
              ref="sessionInputs"
              type="datetime-local"
              class="sessions__input"
              :value="toLocal(session.startsAt)"
              :aria-invalid="form.errors.value[`sessions.${index}.startsAt`] ? 'true' : undefined"
              :aria-describedby="
                form.errors.value[`sessions.${index}.startsAt`]
                  ? `session-${index}-error`
                  : undefined
              "
              @change="setSession(index, ($event.target as HTMLInputElement).value)"
            />
            <p
              v-if="form.errors.value[`sessions.${index}.startsAt`]"
              :id="`session-${index}-error`"
              class="sessions__error"
            >
              {{ form.errors.value[`sessions.${index}.startsAt`] }}
            </p>
          </div>
          <button
            type="button"
            class="sessions__remove"
            :aria-label="`刪除場次 ${index + 1}`"
            :disabled="v.sessions.length <= 1"
            @click="removeSession(index)"
          >
            <IconTrash :size="18" aria-hidden="true" />
          </button>
        </li>
      </ol>
      <p v-if="form.errors.value.sessions" class="sessions__error" role="alert">
        {{ form.errors.value.sessions }}
      </p>
      <BaseButton
        variant="secondary"
        size="sm"
        :disabled="v.sessions.length >= 12"
        @click="addSession"
      >
        <IconPlus :size="16" aria-hidden="true" />
        新增場次
      </BaseButton>
    </section>

    <section class="wform__section" role="group" aria-labelledby="wform-s4">
      <h2 id="wform-s4" class="wform__legend">價格與名額</h2>
      <div class="wform__grid wform__grid--3">
        <BaseInput
          v-model="numbers.price"
          v-bind="form.field('price')"
          label="每人價格（NT$）"
          type="number"
          inputmode="numeric"
          min="100"
          step="50"
          required
        />
        <BaseInput
          v-model="numbers.durationMinutes"
          v-bind="form.field('durationMinutes')"
          label="課程長度（分鐘）"
          type="number"
          inputmode="numeric"
          min="30"
          step="10"
          required
        />
        <BaseInput
          v-model="numbers.capacityPerSession"
          v-bind="form.field('capacityPerSession')"
          label="每班人數上限"
          type="number"
          inputmode="numeric"
          min="1"
          max="40"
          required
        />
      </div>
    </section>

    <div class="wform__actions">
      <span class="wform__dirty" aria-live="polite">{{ dirty ? '尚未儲存' : '' }}</span>
      <BaseButton variant="secondary" :disabled="submitting" @click="submit('draft')"
        >儲存為草稿</BaseButton
      >
      <BaseButton type="submit" :loading="submitting">儲存並上架</BaseButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.wform {
  display: flex;
  flex-direction: column;
  gap: space(5);

  &__summary {
    padding: space(3) space(4);
    border: 1.5px solid color('status-danger-fg');
    border-radius: radius('md');
    background: color('status-danger-bg');
    color: color('status-danger-fg');
    font-weight: 500;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: space(4);
    padding: space(5);
    border: 1px solid color('border-subtle');
    border-radius: radius('lg');
    background: color('bg-surface');
  }

  &__legend {
    @include text('h4');
  }

  &__hint {
    font-size: rem(13px);
    color: color('text-muted');
  }

  &__grid {
    display: grid;
    gap: space(4);

    @include bp(md) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &--3 {
      @include bp(md) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  }

  &__actions {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: space(3);
    padding: space(3) 0;
    border-top: 1px solid color('border-subtle');
    background: color('bg-page');
  }

  &__dirty {
    margin-right: auto;
    font-size: rem(13px);
    color: color('status-warning-fg');
  }
}

.sessions {
  display: flex;
  flex-direction: column;
  gap: space(3);

  &__item {
    display: flex;
    align-items: flex-end;
    gap: space(2);
  }

  &__field {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: space(1);
    max-width: 320px;
  }

  &__label {
    font-size: rem(14px);
    font-weight: 700;
  }

  &__input {
    min-height: 44px;
    padding: 0 space(3);
    border: 1px solid color('border-strong');
    border-radius: radius('md');
    background: color('bg-surface');
    color: color('text-default');
    font-family: var(--font-mono);
    font-size: rem(15px);

    &[aria-invalid='true'] {
      border: 2px solid color('status-danger-fg');
    }
  }

  &__error {
    font-size: rem(13px);
    color: color('status-danger-fg');
  }

  &__remove {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid color('border-subtle');
    border-radius: radius('md');
    background: color('bg-surface');
    color: color('text-default');
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: color('status-danger-fg');
      color: color('status-danger-fg');
    }

    &:disabled {
      color: color('text-muted');
      background: color('bg-sunken');
      cursor: not-allowed;
    }
  }
}
</style>
