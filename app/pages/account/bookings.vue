<script setup lang="ts">
/**
 * 我的預約（F-22）：即將到來／已完成／已取消三個分頁，修改人數與取消都在 Modal 中確認。
 * 修改失敗時錯誤顯示在 Modal 內、保留使用者的輸入（docs/03-user-flow.md Flow 2）。
 */
import type { Booking } from '#shared/types/domain'
import {
  MAX_BOOKING_QUANTITY,
  bookingPhase,
  calculateTotal,
  canModifyBooking,
  FREE_CANCEL_HOURS,
  type BookingPhase,
} from '#shared/utils/booking'
import { formatPrice, formatSessionLong, ticketDate } from '#shared/utils/format'
import { accountService } from '~/services/account.service'
import { toApiError } from '~/services/http'
import { useToastStore } from '~/stores/toast'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: '我的預約', robots: 'noindex, nofollow' })

const toast = useToastStore()
const bookings = ref<Booking[]>([])
const loading = ref(true)
const error = ref('')
const tab = ref<BookingPhase>('upcoming')

async function load() {
  loading.value = true
  error.value = ''
  try {
    bookings.value = await accountService.listBookings()
  } catch (e) {
    error.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const grouped = computed(() => {
  const result: Record<BookingPhase, Booking[]> = { upcoming: [], completed: [], cancelled: [] }
  for (const b of bookings.value) result[bookingPhase(b)].push(b)
  result.completed.reverse() // 已完成：最近的在前
  return result
})

const tabs = computed(() => [
  { key: 'upcoming' as const, label: '即將到來', count: grouped.value.upcoming.length },
  { key: 'completed' as const, label: '已完成', count: grouped.value.completed.length },
  { key: 'cancelled' as const, label: '已取消', count: grouped.value.cancelled.length },
])

const emptyText: Record<BookingPhase, string> = {
  upcoming: '目前沒有即將到來的預約',
  completed: '還沒有完成的課程',
  cancelled: '沒有取消的預約',
}

function replace(updated: Booking) {
  bookings.value = bookings.value.map((b) => (b.id === updated.id ? updated : b))
}

// ── 修改人數 ──
const editing = ref<Booking>()
const editQuantity = ref(1)
const editError = ref('')
const saving = ref(false)
const editOpen = computed({
  get: () => Boolean(editing.value),
  set: (open) => {
    if (!open) editing.value = undefined
  },
})

function openEdit(booking: Booking) {
  editing.value = booking
  editQuantity.value = booking.quantity
  editError.value = ''
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  editError.value = ''
  try {
    replace(await accountService.updateBooking(editing.value.id, editQuantity.value))
    toast.success('已更新人數')
    editing.value = undefined
  } catch (e) {
    editError.value = toApiError(e).message
  } finally {
    saving.value = false
  }
}

// ── 取消 ──
const cancelling = ref<Booking>()
const cancelBusy = ref(false)
const cancelError = ref('')
const cancelOpen = computed({
  get: () => Boolean(cancelling.value),
  set: (open) => {
    if (!open) cancelling.value = undefined
  },
})

function openCancel(booking: Booking) {
  cancelling.value = booking
  cancelError.value = ''
}

async function confirmCancel() {
  if (!cancelling.value) return
  cancelBusy.value = true
  cancelError.value = ''
  try {
    replace(await accountService.cancelBooking(cancelling.value.id))
    toast.success('已取消預約，可在「已取消」分頁查看')
    cancelling.value = undefined
  } catch (e) {
    cancelError.value = toApiError(e).message
  } finally {
    cancelBusy.value = false
  }
}
</script>

<template>
  <AccountShell title="我的預約">
    <BaseEmptyState v-if="error" tone="error" title="無法載入預約" :description="error">
      <BaseButton variant="secondary" @click="load">重新載入</BaseButton>
    </BaseEmptyState>

    <div v-else-if="loading" class="list" aria-busy="true">
      <BaseSkeleton v-for="n in 2" :key="n" height="140px" radius="lg" />
    </div>

    <BaseTabs v-else v-model="tab" :tabs="tabs" label="預約狀態">
      <BaseEmptyState v-if="grouped[tab].length === 0" :title="emptyText[tab]" :heading-level="2">
        <BaseButton v-if="tab === 'upcoming'" variant="secondary" to="/workshops"
          >探索工作坊</BaseButton
        >
      </BaseEmptyState>
      <ul v-else class="list">
        <li
          v-for="booking in grouped[tab]"
          :key="booking.id"
          class="booking-card"
          :class="`is-${tab}`"
        >
          <div class="booking-card__date" aria-hidden="true">
            <span>{{ ticketDate(booking.startsAt).mon }}</span>
            <strong>{{ ticketDate(booking.startsAt).day }}</strong>
            <span>{{ ticketDate(booking.startsAt).weekday }}</span>
          </div>
          <div class="booking-card__body">
            <h2 class="booking-card__title">
              <NuxtLink :to="`/workshops/${booking.workshopSlug}`">{{
                booking.workshopTitle
              }}</NuxtLink>
            </h2>
            <p class="booking-card__meta">{{ formatSessionLong(booking.startsAt) }}</p>
            <p class="booking-card__meta">
              {{ booking.quantity }} 位・<span class="mono">{{ formatPrice(booking.total) }}</span
              >・預約編號
              <span class="mono">#{{ booking.id }}</span>
            </p>
            <div v-if="tab === 'upcoming'" class="booking-card__actions">
              <template v-if="canModifyBooking(booking)">
                <BaseButton size="sm" variant="secondary" @click="openEdit(booking)"
                  >修改人數</BaseButton
                >
                <BaseButton size="sm" variant="ghost" @click="openCancel(booking)"
                  >取消預約</BaseButton
                >
              </template>
              <p v-else class="booking-card__note">
                開課前 {{ FREE_CANCEL_HOURS }} 小時內無法線上修改或取消
              </p>
            </div>
            <p v-if="tab === 'cancelled' && booking.cancelledAt" class="booking-card__note">
              已於 {{ formatSessionLong(booking.cancelledAt) }} 取消
            </p>
          </div>
        </li>
      </ul>
    </BaseTabs>

    <BaseModal v-model:open="editOpen" title="修改人數" :persistent="saving">
      <div v-if="editing" class="modal-body">
        <p>
          {{ editing.workshopTitle }}<br /><span class="muted">{{
            formatSessionLong(editing.startsAt)
          }}</span>
        </p>
        <BaseQuantity v-model="editQuantity" label="人數" :max="MAX_BOOKING_QUANTITY" />
        <p class="modal-total">
          新的總金額
          <strong class="mono">{{
            formatPrice(calculateTotal(editing.unitPrice, editQuantity))
          }}</strong>
        </p>
        <p v-if="editError" class="modal-error" role="alert">{{ editError }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="saving" @click="editOpen = false">返回</BaseButton>
        <BaseButton
          :loading="saving"
          :disabled="editing?.quantity === editQuantity"
          @click="saveEdit"
        >
          儲存
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model:open="cancelOpen"
      title="確定要取消這筆預約？"
      :description="`開課 ${FREE_CANCEL_HOURS} 小時前取消不收取費用。取消後名額會釋出，無法復原。`"
      :persistent="cancelBusy"
    >
      <div v-if="cancelling" class="modal-body">
        <p>
          {{ cancelling.workshopTitle }}<br /><span class="muted"
            >{{ formatSessionLong(cancelling.startsAt) }}・{{ cancelling.quantity }} 位</span
          >
        </p>
        <p v-if="cancelError" class="modal-error" role="alert">{{ cancelError }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="cancelBusy" @click="cancelOpen = false"
          >保留預約</BaseButton
        >
        <BaseButton variant="danger" :loading="cancelBusy" @click="confirmCancel"
          >確定取消</BaseButton
        >
      </template>
    </BaseModal>
  </AccountShell>
</template>

<style scoped lang="scss">
.list {
  display: flex;
  flex-direction: column;
  gap: space(4);
}

.booking-card {
  display: flex;
  overflow: hidden;
  border: 1.5px solid color('border-ink');
  border-radius: radius('lg');
  background: color('bg-surface');

  &.is-cancelled,
  &.is-completed {
    border-color: color('border-subtle');
  }

  &__date {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80px;
    border-right: 2px dashed color('border-dashed');
    background: color('bg-ticket');
    font-family: var(--font-mono);
    font-size: rem(12px);

    strong {
      font-size: rem(28px);
      font-weight: 500;
      line-height: 1.1;
    }

    .is-cancelled & {
      background: color('bg-sunken');
    }
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: space(1);
    min-width: 0;
    padding: space(4) space(5);
  }

  &__title {
    @include text('h4');

    a {
      color: color('text-default');
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .is-cancelled & a {
      text-decoration: line-through;
    }
  }

  &__meta {
    color: color('text-muted');
    font-size: rem(14px);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: space(2);
    margin-top: space(3);
  }

  &__note {
    margin-top: space(2);
    color: color('text-muted');
    font-size: rem(13px);
  }
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: space(4);
}

.modal-total {
  display: flex;
  justify-content: space-between;
  padding-top: space(3);
  border-top: 1px dashed color('border-dashed');
}

.modal-error {
  padding: space(3);
  border-radius: radius('md');
  background: color('status-danger-bg');
  color: color('status-danger-fg');
  font-size: rem(14px);
}

.muted {
  color: color('text-muted');
  font-size: rem(14px);
}

.mono {
  font-family: var(--font-mono);
}
</style>
