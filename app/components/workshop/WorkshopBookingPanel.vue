<script setup lang="ts">
/**
 * 詳細頁右側的預約面板：選場次、選人數、即時小計、前往預約。
 *
 * 剩餘名額：頁面 HTML 來自 ISR 快取（所有人相同）。登入的使用者在瀏覽器端
 * 另外取得「扣除自己預約後」的名額，個人資料不會進入快取。
 * 金額只是預覽，實際金額由伺服器在建立預約時計算。
 */
import type { Workshop, WorkshopSession } from '#shared/types/domain'
import { MAX_BOOKING_QUANTITY } from '#shared/schemas'
import { formatPrice, formatSessionShort, seatsLabel } from '#shared/utils/format'
import { calculateTotal, FREE_CANCEL_HOURS } from '#shared/utils/booking'
import { catalogService } from '~/services/catalog.service'

const props = defineProps<{ workshop: Workshop }>()
const { loggedIn } = useAuth()

const sessions = ref<WorkshopSession[]>(props.workshop.sessions)
const selectedId = ref(props.workshop.nextSession?.id ?? '')
const quantity = ref(1)
const sessionError = ref('')

const selected = computed(() => sessions.value.find((s) => s.id === selectedId.value))
const maxQuantity = computed(() =>
  Math.max(1, Math.min(MAX_BOOKING_QUANTITY, selected.value?.seatsLeft ?? MAX_BOOKING_QUANTITY)),
)
const subtotal = computed(() => calculateTotal(props.workshop.price, quantity.value))

watch(maxQuantity, (max) => {
  if (quantity.value > max) quantity.value = max
})

async function loadPersonalSeats() {
  try {
    sessions.value = await catalogService.getSessions(props.workshop.slug)
    if (selected.value && selected.value.seatsLeft === 0) {
      selectedId.value = sessions.value.find((s) => s.seatsLeft > 0)?.id ?? ''
    }
  } catch {
    // 取不到個人化名額時沿用頁面上的名額；送出預約時伺服器仍會再檢查一次
  }
}

watch(loggedIn, (value) => value && loadPersonalSeats(), { immediate: import.meta.client })

function onBook() {
  if (!selected.value) {
    sessionError.value = '請先選擇場次'
    return
  }
  sessionError.value = ''
  navigateTo({
    path: `/booking/${props.workshop.slug}`,
    query: { session: selected.value.id, qty: String(quantity.value) },
  })
}
</script>

<template>
  <div class="booking-panel">
    <p class="booking-panel__price">
      <span class="booking-panel__amount">{{ formatPrice(workshop.price) }}</span>
      <span class="booking-panel__unit">／人</span>
    </p>

    <fieldset
      class="booking-panel__sessions"
      :aria-describedby="sessionError ? 'session-error' : undefined"
    >
      <legend class="booking-panel__legend">選擇場次</legend>
      <label
        v-for="session in sessions"
        :key="session.id"
        class="session"
        :class="{ 'is-selected': session.id === selectedId, 'is-full': session.seatsLeft === 0 }"
      >
        <input
          v-model="selectedId"
          type="radio"
          name="session"
          :value="session.id"
          :disabled="session.seatsLeft === 0"
        />
        <span class="session__time">{{ formatSessionShort(session.startsAt) }}</span>
        <span class="session__seats" :class="`is-${seatsLabel(session.seatsLeft).tone}`">
          {{ seatsLabel(session.seatsLeft).text }}
        </span>
      </label>
      <p v-if="sessions.length === 0" class="booking-panel__note">目前沒有開放的場次。</p>
      <p v-if="sessionError" id="session-error" class="booking-panel__error" role="alert">
        {{ sessionError }}
      </p>
    </fieldset>

    <BaseQuantity v-model="quantity" label="人數" :max="maxQuantity" />

    <p class="booking-panel__subtotal">
      <span>小計</span>
      <output class="booking-panel__amount booking-panel__amount--sm" aria-live="polite">
        {{ formatPrice(subtotal) }}
      </output>
    </p>

    <BaseButton
      size="lg"
      block
      :disabled="sessions.every((s) => s.seatsLeft === 0)"
      @click="onBook"
    >
      立即預約
    </BaseButton>
    <p class="booking-panel__note">開課 {{ FREE_CANCEL_HOURS }} 小時前可免費取消</p>
  </div>
</template>

<style scoped lang="scss">
.booking-panel {
  display: flex;
  flex-direction: column;
  gap: space(5);
  padding: space(5);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');
  box-shadow: shadow('md');

  &__price {
    display: flex;
    align-items: baseline;
    gap: space(1);
  }

  &__amount {
    font-family: var(--font-mono);
    font-size: rem(26px);
    font-weight: 500;

    &--sm {
      font-size: rem(18px);
    }
  }

  &__unit {
    font-size: rem(14px);
    color: color('text-muted');
  }

  &__sessions {
    display: flex;
    flex-direction: column;
    gap: space(2);
    margin: 0;
    padding: 0;
    border: none;
  }

  &__legend {
    margin-bottom: space(2);
    font-size: rem(14px);
    font-weight: 700;
  }

  &__subtotal {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: space(4);
    border-top: 1px dashed color('border-dashed');
  }

  &__note {
    font-size: rem(13px);
    color: color('text-muted');
    text-align: center;
  }

  &__error {
    font-size: rem(13px);
    color: color('status-danger-fg');
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

    &.is-warning {
      color: color('status-warning-fg');
      font-weight: 700;
    }

    &.is-muted {
      color: color('text-muted');
    }

    &.is-full {
      color: color('text-muted');
    }
  }
}
</style>
