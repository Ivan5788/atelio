<script setup lang="ts">
/**
 * 預約完成頁：明細、加入行事曆、前往我的預約。
 * 資料以預約 id 向伺服器重新讀取（不是沿用上一頁的狀態），重新整理也能正常顯示；
 * 別人的預約 id 會得到 404（IDOR 防護在伺服器）。
 */
import { CalendarPlus as IconCalendar, CircleCheck as IconCheck } from 'lucide-vue-next'
import type { Booking, Workshop } from '#shared/types/domain'
import { formatPrice, formatSessionLong } from '#shared/utils/format'
import { accountService } from '~/services/account.service'
import { catalogService } from '~/services/catalog.service'
import { toApiError } from '~/services/http'
import { buildIcs } from '~/utils/calendar'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: '預約完成', robots: 'noindex, nofollow' })

const route = useRoute()
const booking = ref<Booking>()
const workshop = ref<Workshop>()
const error = ref('')
const headingRef = ref<HTMLElement>()

onMounted(async () => {
  try {
    booking.value = await accountService.getBooking(String(route.params.id))
    workshop.value = (await catalogService.getWorkshop(booking.value.workshopSlug)).workshop
    await nextTick()
    headingRef.value?.focus()
  } catch (e) {
    error.value = toApiError(e).message
  }
})

function downloadIcs() {
  if (!booking.value || !workshop.value) return
  const ics = buildIcs({
    uid: booking.value.id,
    title: booking.value.workshopTitle,
    start: booking.value.startsAt,
    durationMinutes: workshop.value.durationMinutes,
    location: workshop.value.address,
    description: `Atelio 示範預約 #${booking.value.id}，${booking.value.quantity} 位`,
  })
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `atelio-${booking.value.id}.ics`,
  })
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="container complete">
    <BaseEmptyState v-if="error" tone="error" title="找不到這筆預約" :description="error">
      <BaseButton variant="secondary" to="/account/bookings">查看我的預約</BaseButton>
    </BaseEmptyState>

    <div v-else-if="!booking" class="complete__card" aria-busy="true">
      <BaseSkeleton height="64px" width="64px" radius="full" />
      <BaseSkeleton height="32px" width="60%" />
      <BaseSkeleton height="200px" radius="md" />
    </div>

    <div v-else class="complete__card">
      <span class="complete__icon" aria-hidden="true"><IconCheck :size="36" /></span>
      <h1 ref="headingRef" tabindex="-1" class="complete__title">預約完成！</h1>
      <p class="complete__lead">
        已收到你的預約，開課前請準時到場。這是示範網站，不會寄出通知或實際收費。
      </p>

      <dl class="complete__summary">
        <div>
          <dt>預約編號</dt>
          <dd class="mono">#{{ booking.id }}</dd>
        </div>
        <div>
          <dt>工作坊</dt>
          <dd>{{ booking.workshopTitle }}</dd>
        </div>
        <div>
          <dt>場次</dt>
          <dd>{{ formatSessionLong(booking.startsAt) }}</dd>
        </div>
        <div>
          <dt>人數</dt>
          <dd>{{ booking.quantity }} 位</dd>
        </div>
        <div>
          <dt>總金額</dt>
          <dd class="mono">{{ formatPrice(booking.total) }}</dd>
        </div>
      </dl>

      <div class="complete__actions">
        <BaseButton variant="secondary" :disabled="!workshop" @click="downloadIcs">
          <IconCalendar :size="18" aria-hidden="true" />
          加入行事曆
        </BaseButton>
        <BaseButton to="/account/bookings">前往我的預約</BaseButton>
      </div>
      <NuxtLink to="/workshops" class="complete__more">繼續探索其他工作坊 →</NuxtLink>
    </div>
  </div>
</template>

<style scoped lang="scss">
.complete {
  display: flex;
  justify-content: center;
  padding-block: space(7) space(8);

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: space(4);
    width: 100%;
    max-width: 560px;
    padding: space(6) space(5);
    border: 1.5px solid color('border-ink');
    border-radius: radius('lg');
    background: color('bg-surface');
    box-shadow: shadow('sticker');
    text-align: center;
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: radius('full');
    background: color('status-success-bg');
    color: color('status-success-fg');
  }

  &__title {
    @include text('h2');

    &:focus {
      outline: none;
    }
  }

  &__lead {
    color: color('text-muted');
  }

  &__summary {
    width: 100%;
    padding: space(4);
    border: 2px dashed color('border-dashed');
    border-radius: radius('md');
    background: color('bg-ticket');
    text-align: left;

    div {
      display: grid;
      grid-template-columns: 5.5em 1fr;
      gap: space(3);
      padding-block: space(2);
    }

    dt {
      color: color('text-muted');
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: space(3);
  }

  &__more {
    font-size: rem(15px);
  }
}

.mono {
  font-family: var(--font-mono);
}
</style>
