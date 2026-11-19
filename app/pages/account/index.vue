<script setup lang="ts">
/**
 * 會員中心總覽：下一堂課、預約與收藏數量、帳號到期時間。
 */
import type { Booking, PublicUser } from '#shared/types/domain'
import { bookingPhase } from '#shared/utils/booking'
import { formatDate, formatSessionLong } from '#shared/utils/format'
import { accountService } from '~/services/account.service'
import { toApiError } from '~/services/http'
import { useFavoritesStore } from '~/stores/favorites'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: '會員中心', robots: 'noindex, nofollow' })

const favorites = useFavoritesStore()
const me = ref<PublicUser>()
const bookings = ref<Booking[]>([])
const error = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[me.value, bookings.value] = await Promise.all([
      accountService.me(),
      accountService.listBookings(),
    ])
  } catch (e) {
    error.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

const upcoming = computed(() => bookings.value.filter((b) => bookingPhase(b) === 'upcoming'))
const next = computed(() => upcoming.value[0])
const hoursLeft = computed(() =>
  me.value ? Math.max(0, Math.round((Date.parse(me.value.expiresAt) - Date.now()) / 3_600_000)) : 0,
)
</script>

<template>
  <AccountShell :title="me ? `你好，${me.name}` : '會員中心'">
    <BaseEmptyState v-if="error" tone="error" title="無法載入會員資料" :description="error">
      <BaseButton variant="secondary" @click="load">重新載入</BaseButton>
    </BaseEmptyState>

    <div v-else-if="loading" class="overview" aria-busy="true">
      <BaseSkeleton v-for="n in 3" :key="n" height="120px" radius="lg" />
    </div>

    <template v-else-if="me">
      <p class="notice">
        這個帳號會在 <strong>{{ formatDate(me.expiresAt) }}</strong>（約
        {{ hoursLeft }} 小時後）連同所有資料自動刪除。
      </p>

      <div class="overview">
        <section class="tile tile--wide" aria-labelledby="next-title">
          <h2 id="next-title" class="tile__label">下一堂課</h2>
          <template v-if="next">
            <p class="tile__title">
              <NuxtLink :to="`/workshops/${next.workshopSlug}`">{{ next.workshopTitle }}</NuxtLink>
            </p>
            <p class="tile__muted">
              {{ formatSessionLong(next.startsAt) }}・{{ next.quantity }} 位
            </p>
          </template>
          <p v-else class="tile__muted">
            目前沒有即將到來的預約。<NuxtLink to="/workshops">去找一堂課 →</NuxtLink>
          </p>
        </section>
        <NuxtLink to="/account/bookings" class="tile tile--link">
          <span class="tile__label">即將到來的預約</span>
          <span class="tile__number">{{ upcoming.length }}</span>
        </NuxtLink>
        <NuxtLink to="/account/favorites" class="tile tile--link">
          <span class="tile__label">收藏的工作坊</span>
          <span class="tile__number">{{ favorites.slugs.length }}</span>
        </NuxtLink>
      </div>

      <aside class="studio-cta" aria-labelledby="studio-cta-title">
        <h2 id="studio-cta-title" class="studio-cta__title">試試開課者後台</h2>
        <p>每個帳號都可以進入示範的 Studio：查看報名數據、新增與管理工作坊。</p>
        <BaseButton variant="secondary" to="/studio">前往 Studio</BaseButton>
      </aside>
    </template>
  </AccountShell>
</template>

<style scoped lang="scss">
.notice {
  padding: space(3) space(4);
  border-radius: radius('md');
  background: color('status-info-bg');
  color: color('text-default');
  font-size: rem(14px);
}

.overview {
  display: grid;
  gap: space(4);

  @include bp(md) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.tile {
  display: flex;
  flex-direction: column;
  gap: space(2);
  padding: space(5);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');
  color: color('text-default');
  text-decoration: none;

  &--wide {
    @include bp(md) {
      grid-column: 1 / -1;
    }
  }

  &--link:hover {
    border-color: color('border-ink');
    color: color('text-default');
  }

  &__label {
    font-family: var(--font-body);
    font-size: rem(14px);
    font-weight: 700;
    color: color('text-muted');
  }

  &__title {
    @include text('h3');
  }

  &__number {
    font-family: var(--font-mono);
    font-size: rem(36px);
    line-height: 1;
  }

  &__muted {
    color: color('text-muted');
  }
}

.studio-cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: space(3);
  padding: space(5);
  border-radius: radius('lg');
  background: color('bg-organizer');

  &__title {
    @include text('h3');
  }
}
</style>
