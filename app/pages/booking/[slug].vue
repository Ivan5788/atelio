<script setup lang="ts">
/**
 * 預約流程（F-21）：選場次與人數 → 聯絡資料 → 確認送出。CSR + 需要登入。
 *
 * - 草稿存在 Pinia（booking-draft），切換步驟或送出失敗時資料不會遺失。
 * - 每一步切換時把焦點移到該步的標題，鍵盤與螢幕閱讀器使用者知道畫面已經換了。
 * - 名額不足（409）時回到第一步、重新載入名額並說明原因（docs/03-user-flow.md Flow 1）。
 * - 畫面上的金額只是預覽；實際金額由伺服器計算，送出成功後以伺服器回傳的金額為準。
 */
import { storeToRefs } from 'pinia'
import type { Workshop, WorkshopSession } from '#shared/types/domain'
import { contactSchema, MAX_BOOKING_QUANTITY } from '#shared/schemas'
import {
  formatPrice,
  formatSessionLong,
  formatSessionShort,
  seatsLabel,
} from '#shared/utils/format'
import { calculateTotal, canModifyBooking, FREE_CANCEL_HOURS } from '#shared/utils/booking'
import { accountService } from '~/services/account.service'
import { catalogService } from '~/services/catalog.service'
import { toApiError } from '~/services/http'
import { useBookingDraftStore } from '~/stores/booking-draft'
import { useToastStore } from '~/stores/toast'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: '預約工作坊', robots: 'noindex, nofollow' })

const route = useRoute()
const slug = String(route.params.slug)
const draft = useBookingDraftStore()
const { sessionId, quantity, contact } = storeToRefs(draft)
const toast = useToastStore()
const { user } = useAuth()

draft.start(slug, {
  sessionId: typeof route.query.session === 'string' ? route.query.session : undefined,
  quantity: Number(route.query.qty) || undefined,
})
if (!contact.value.name && user.value) contact.value.name = user.value.name

const workshop = ref<Workshop>()
const sessions = ref<WorkshopSession[]>([])
const loadError = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [detail, personal] = await Promise.all([
      catalogService.getWorkshop(slug),
      catalogService.getSessions(slug),
    ])
    workshop.value = detail.workshop
    sessions.value = personal
    if (!sessions.value.some((s) => s.id === sessionId.value && s.seatsLeft > 0)) {
      sessionId.value = sessions.value.find((s) => s.seatsLeft > 0)?.id ?? ''
    }
  } catch (error) {
    loadError.value = toApiError(error).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const STEPS = ['選擇場次', '聯絡資料', '確認送出']
const step = ref(0)
const headingRef = ref<HTMLElement>()

function goTo(index: number) {
  step.value = index
  nextTick(() => {
    headingRef.value?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

const selected = computed(() => sessions.value.find((s) => s.id === sessionId.value))
const maxQuantity = computed(() =>
  Math.max(1, Math.min(MAX_BOOKING_QUANTITY, selected.value?.seatsLeft ?? MAX_BOOKING_QUANTITY)),
)
watch(maxQuantity, (max) => {
  if (quantity.value > max) quantity.value = max
})
const total = computed(() =>
  workshop.value ? calculateTotal(workshop.value.price, quantity.value) : 0,
)
const freeCancel = computed(() =>
  selected.value
    ? canModifyBooking({ status: 'confirmed', startsAt: selected.value.startsAt })
    : true,
)

// ── Step 1 ──
const step1Error = ref('')
function submitStep1() {
  if (!selected.value) {
    step1Error.value = '請選擇一個場次'
    return
  }
  step1Error.value = ''
  goTo(1)
}

// ── Step 2 ──
const form = useZodForm(contactSchema, contact.value)
// useZodForm 複製了一份初始值；同步回草稿，回到上一步再前進時資料仍在
watch(
  () => ({ ...form.values }),
  (values) => Object.assign(contact.value, values),
  { deep: true },
)
function submitStep2() {
  if (form.validateAll()) goTo(2)
}

// ── Step 3 ──
const submitting = ref(false)
const conflictMessage = ref('')

async function submitBooking() {
  const parsedContact = form.validateAll()
  if (!parsedContact || !selected.value) return
  submitting.value = true
  conflictMessage.value = ''
  try {
    const booking = await accountService.createBooking({
      workshopSlug: slug,
      sessionId: selected.value.id,
      quantity: quantity.value,
      contact: parsedContact,
    })
    draft.clear()
    await navigateTo(`/booking/complete/${booking.id}`, { replace: true })
  } catch (error) {
    const apiError = toApiError(error)
    if (apiError.statusCode === 409) {
      // 名額在填寫期間被佔走：回到第一步並重新載入最新名額
      conflictMessage.value = apiError.message
      await load()
      goTo(0)
    } else if (apiError.statusCode === 400) {
      form.setServerErrors(
        Object.fromEntries(
          Object.entries(apiError.fieldErrors).map(([k, v]) => [k.replace(/^contact\./, ''), v]),
        ),
      )
      goTo(1)
    } else {
      // 網路或伺服器錯誤：留在這一步，資料保留，可以直接再按一次
      toast.error(`${apiError.message}（資料已保留，可以再試一次）`)
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container booking">
    <AppBreadcrumb
      :items="[{ label: workshop?.title ?? '工作坊', to: `/workshops/${slug}` }, { label: '預約' }]"
    />

    <div v-if="loading && !workshop" class="booking__loading" aria-busy="true">
      <BaseSkeleton height="40px" width="60%" />
      <BaseSkeleton height="320px" radius="lg" />
      <span class="visually-hidden">載入中</span>
    </div>

    <BaseEmptyState
      v-else-if="loadError"
      tone="error"
      title="無法載入預約資訊"
      :description="loadError"
    >
      <BaseButton variant="secondary" @click="load">重新載入</BaseButton>
      <BaseButton variant="ghost" :to="`/workshops/${slug}`">回到工作坊</BaseButton>
    </BaseEmptyState>

    <template v-else-if="workshop">
      <h1 class="booking__title">預約：{{ workshop.title }}</h1>
      <BookingSteps :steps="STEPS" :current="step" />

      <div class="booking__layout">
        <section class="booking__panel" :aria-labelledby="`step-${step}-title`">
          <!-- Step 1：場次與人數 -->
          <form v-if="step === 0" class="booking__form" novalidate @submit.prevent="submitStep1">
            <h2 id="step-0-title" ref="headingRef" tabindex="-1" class="booking__step-title">
              選擇場次與人數
            </h2>
            <p v-if="conflictMessage" class="booking__alert" role="alert">
              {{ conflictMessage }}，名額已更新，請重新選擇。
            </p>
            <fieldset
              class="booking__sessions"
              :aria-describedby="step1Error ? 'step1-error' : undefined"
            >
              <legend class="visually-hidden">場次</legend>
              <label
                v-for="session in sessions"
                :key="session.id"
                class="session"
                :class="{
                  'is-selected': session.id === sessionId,
                  'is-full': session.seatsLeft === 0,
                }"
              >
                <input
                  v-model="sessionId"
                  type="radio"
                  name="booking-session"
                  :value="session.id"
                  :disabled="session.seatsLeft === 0"
                />
                <span class="session__time">{{ formatSessionShort(session.startsAt) }}</span>
                <span class="session__seats">{{ seatsLabel(session.seatsLeft).text }}</span>
              </label>
            </fieldset>
            <p v-if="step1Error" id="step1-error" class="booking__field-error" role="alert">
              {{ step1Error }}
            </p>
            <BaseQuantity v-model="quantity" label="人數" :max="maxQuantity" />
            <div class="booking__actions">
              <BaseButton variant="ghost" :to="`/workshops/${slug}`">返回工作坊</BaseButton>
              <BaseButton type="submit" size="lg">下一步：聯絡資料</BaseButton>
            </div>
          </form>

          <!-- Step 2：聯絡資料 -->
          <form
            v-else-if="step === 1"
            class="booking__form"
            novalidate
            @submit.prevent="submitStep2"
          >
            <h2 id="step-1-title" ref="headingRef" tabindex="-1" class="booking__step-title">
              聯絡資料
            </h2>
            <p class="booking__muted">示範網站請勿填寫真實資料，可以使用 0912345678 這類假號碼。</p>
            <BaseInput
              v-model="form.values.name"
              v-bind="form.field('name')"
              label="聯絡人姓名"
              autocomplete="name"
              required
            />
            <BaseInput
              v-model="form.values.phone"
              v-bind="form.field('phone')"
              label="手機號碼"
              type="tel"
              autocomplete="tel"
              inputmode="tel"
              hint="09 開頭共 10 碼"
              required
            />
            <BaseInput
              v-model="form.values.note"
              v-bind="form.field('note')"
              label="備註（選填）"
              multiline
              :rows="3"
              maxlength="200"
              hint="例如：慣用左手、飲食限制，最多 200 字"
            />
            <div class="booking__actions">
              <BaseButton variant="ghost" @click="goTo(0)">上一步</BaseButton>
              <BaseButton type="submit" size="lg">下一步：確認</BaseButton>
            </div>
          </form>

          <!-- Step 3：確認 -->
          <div v-else class="booking__form">
            <h2 id="step-2-title" ref="headingRef" tabindex="-1" class="booking__step-title">
              確認預約內容
            </h2>
            <dl class="summary">
              <div>
                <dt>工作坊</dt>
                <dd>{{ workshop.title }}</dd>
              </div>
              <div>
                <dt>場次</dt>
                <dd>{{ selected ? formatSessionLong(selected.startsAt) : '—' }}</dd>
              </div>
              <div>
                <dt>地點</dt>
                <dd>{{ workshop.address }}</dd>
              </div>
              <div>
                <dt>人數</dt>
                <dd>{{ quantity }} 位</dd>
              </div>
              <div>
                <dt>聯絡人</dt>
                <dd>{{ form.values.name }}・{{ form.values.phone }}</dd>
              </div>
              <div v-if="form.values.note">
                <dt>備註</dt>
                <dd>{{ form.values.note }}</dd>
              </div>
            </dl>
            <p class="booking__muted">
              <template v-if="freeCancel"
                >開課 {{ FREE_CANCEL_HOURS }} 小時前可在「我的預約」免費取消或修改人數。</template
              >
              <template v-else
                >這個場次距離開課不到 {{ FREE_CANCEL_HOURS }} 小時，預約後無法線上取消。</template
              >
              本站為示範網站，不會實際收費。
            </p>
            <div class="booking__actions">
              <BaseButton variant="ghost" :disabled="submitting" @click="goTo(1)"
                >上一步</BaseButton
              >
              <BaseButton size="lg" :loading="submitting" @click="submitBooking"
                >確認預約</BaseButton
              >
            </div>
          </div>
        </section>

        <aside class="booking__aside" aria-label="預約摘要">
          <h2 class="booking__aside-title">{{ workshop.title }}</h2>
          <p class="booking__muted">
            {{ workshop.cityName }}{{ workshop.district }}・{{ workshop.instructor.name }}
          </p>
          <dl class="ticket">
            <div>
              <dt>場次</dt>
              <dd>{{ selected ? formatSessionShort(selected.startsAt) : '尚未選擇' }}</dd>
            </div>
            <div>
              <dt>單價</dt>
              <dd>{{ formatPrice(workshop.price) }}</dd>
            </div>
            <div>
              <dt>人數</dt>
              <dd>× {{ quantity }}</dd>
            </div>
            <div class="ticket__total">
              <dt>總計</dt>
              <dd aria-live="polite">{{ formatPrice(total) }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.booking {
  display: flex;
  flex-direction: column;
  gap: space(5);
  padding-block: space(5) space(8);

  &__loading {
    display: flex;
    flex-direction: column;
    gap: space(4);
  }

  &__title {
    @include text('h2');
  }

  &__layout {
    display: grid;
    gap: space(6);
    align-items: start;

    @include bp(lg) {
      grid-template-columns: minmax(0, 1fr) 340px;
    }
  }

  &__panel {
    padding: space(5);
    border: 1px solid color('border-subtle');
    border-radius: radius('lg');
    background: color('bg-surface');

    @include bp(md) {
      padding: space(6);
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: space(5);
  }

  &__step-title {
    @include text('h3');

    &:focus {
      outline: none;
    }
  }

  &__sessions {
    display: grid;
    gap: space(2);
    margin: 0;
    padding: 0;
    border: none;

    @include bp(md) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  &__alert {
    padding: space(3) space(4);
    border-radius: radius('md');
    background: color('status-warning-bg');
    color: color('status-warning-fg');
    font-weight: 500;
  }

  &__field-error {
    margin-top: -#{space(3)};
    color: color('status-danger-fg');
    font-size: rem(13px);
  }

  &__muted {
    color: color('text-muted');
    font-size: rem(14px);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap-reverse;
    justify-content: space-between;
    gap: space(3);
    padding-top: space(4);
    border-top: 1px solid color('border-subtle');
  }

  &__aside {
    display: flex;
    flex-direction: column;
    gap: space(3);
    padding: space(5);
    border: 1.5px solid color('border-ink');
    border-radius: radius('lg');
    background: color('bg-ticket');

    @include bp(lg) {
      position: sticky;
      top: space(4);
    }
  }

  &__aside-title {
    @include text('h4');
  }
}

.session {
  display: flex;
  align-items: center;
  gap: space(3);
  min-height: 52px;
  padding: 0 space(4);
  border: 1px solid color('border-strong');
  border-radius: radius('md');
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    accent-color: var(--palette-blush-800);
  }

  &:has(input:focus-visible) {
    outline: 2px solid color('border-focus');
    outline-offset: 2px;
  }

  &.is-selected {
    border: 2px solid color('action-accent-fg');
    background: color('bg-selected');
  }

  &.is-full {
    border-color: color('border-subtle');
    background: color('bg-sunken');
    color: color('text-muted');
    cursor: not-allowed;
  }

  &__time {
    flex: 1;
    font-family: var(--font-mono);
    font-size: rem(14px);
  }

  &__seats {
    font-size: rem(13px);
    color: color('text-muted');
  }
}

.summary {
  display: flex;
  flex-direction: column;

  div {
    display: grid;
    grid-template-columns: 5em 1fr;
    gap: space(3);
    padding-block: space(3);
    border-bottom: 1px solid color('border-subtle');
  }

  dt {
    color: color('text-muted');
  }
}

.ticket {
  display: flex;
  flex-direction: column;
  gap: space(2);
  padding-top: space(3);
  border-top: 2px dashed color('border-dashed');

  div {
    display: flex;
    justify-content: space-between;
    gap: space(3);
  }

  dd {
    font-family: var(--font-mono);
  }

  &__total {
    margin-top: space(2);
    padding-top: space(3);
    border-top: 1px solid color('border-dashed');
    font-weight: 700;

    dd {
      font-size: rem(20px);
    }
  }
}
</style>
