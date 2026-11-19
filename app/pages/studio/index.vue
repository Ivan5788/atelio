<script setup lang="ts">
/**
 * Studio 數據總覽（F-30）：KPI、近 6 個月報名趨勢、本月各工作坊報名數。
 * 數字是依工作坊與月份產生的示範資料；下架或刪除工作坊後，統計會跟著改變。
 */
import { ArrowDown as IconDown, ArrowUp as IconUp } from 'lucide-vue-next'
import type { StudioStats } from '#shared/types/domain'
import { formatPrice } from '#shared/utils/format'
import { toApiError } from '~/services/http'
import { studioService } from '~/services/studio.service'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Studio 數據總覽', robots: 'noindex, nofollow' })

const stats = ref<StudioStats>()
const error = ref('')

async function load() {
  error.value = ''
  try {
    stats.value = await studioService.stats()
  } catch (e) {
    error.value = toApiError(e).message
  }
}
onMounted(load)

const share = computed(() =>
  [...(stats.value?.workshopShare ?? [])].sort((a, b) => b.bookings - a.bookings),
)
const trendSummary = computed(() => {
  const t = stats.value?.trend ?? []
  return t.length
    ? `近 6 個月報名數折線圖，從 ${t[0]!.label} 的 ${t[0]!.bookings} 筆到 ${t.at(-1)!.label} 的 ${t.at(-1)!.bookings} 筆`
    : ''
})
</script>

<template>
  <StudioShell title="數據總覽">
    <template #actions>
      <BaseButton to="/studio/workshops/new">新增工作坊</BaseButton>
    </template>

    <BaseEmptyState v-if="error" tone="error" title="無法載入統計資料" :description="error">
      <BaseButton variant="secondary" @click="load">重新載入</BaseButton>
    </BaseEmptyState>

    <template v-else-if="!stats">
      <div class="kpis" aria-busy="true">
        <BaseSkeleton v-for="n in 4" :key="n" height="112px" radius="lg" />
      </div>
      <BaseSkeleton height="340px" radius="lg" />
    </template>

    <template v-else>
      <p class="demo-note">以下為示範數字，依工作坊與月份產生，同一個月份每次看到的結果相同。</p>
      <dl class="kpis">
        <div class="kpi">
          <dt>本月報名</dt>
          <dd class="kpi__value">{{ stats.kpis.monthlyBookings }} <span>筆</span></dd>
          <dd
            class="kpi__change"
            :class="stats.kpis.monthlyBookingsChange >= 0 ? 'is-up' : 'is-down'"
          >
            <IconUp v-if="stats.kpis.monthlyBookingsChange >= 0" :size="14" aria-hidden="true" />
            <IconDown v-else :size="14" aria-hidden="true" />
            較上月 {{ stats.kpis.monthlyBookingsChange >= 0 ? '增加' : '減少' }}
            {{ Math.abs(stats.kpis.monthlyBookingsChange) }}%
          </dd>
        </div>
        <div class="kpi">
          <dt>本月營收</dt>
          <dd class="kpi__value">{{ formatPrice(stats.kpis.monthlyRevenue) }}</dd>
        </div>
        <div class="kpi">
          <dt>平均評分</dt>
          <dd class="kpi__value">
            {{ stats.kpis.averageRating ? stats.kpis.averageRating.toFixed(1) : '—' }}
          </dd>
        </div>
        <div class="kpi">
          <dt>滿班率（近期場次）</dt>
          <dd class="kpi__value">{{ stats.kpis.fillRate }}<span>%</span></dd>
        </div>
      </dl>

      <section class="panel" aria-labelledby="trend-title">
        <h2 id="trend-title" class="panel__title">近 6 個月報名趨勢</h2>
        <ClientOnly>
          <LazyStudioChart
            type="line"
            :labels="stats.trend.map((t) => t.label)"
            :values="stats.trend.map((t) => t.bookings)"
            unit="筆"
            :summary="trendSummary"
            table-caption="近 6 個月報名數"
            label-header="月份"
          />
          <template #fallback><BaseSkeleton height="260px" radius="md" /></template>
        </ClientOnly>
      </section>

      <section class="panel" aria-labelledby="share-title">
        <h2 id="share-title" class="panel__title">本月各工作坊報名數</h2>
        <BaseEmptyState
          v-if="share.length === 0"
          title="目前沒有已上架的工作坊"
          description="上架工作坊後，這裡會顯示各工作坊的報名數。"
          :heading-level="3"
        />
        <ClientOnly v-else>
          <LazyStudioChart
            type="bar"
            :labels="share.map((s) => s.title)"
            :values="share.map((s) => s.bookings)"
            unit="筆"
            :summary="`本月各工作坊報名數長條圖，最多的是「${share[0]!.title}」${share[0]!.bookings} 筆`"
            table-caption="本月各工作坊報名數"
            label-header="工作坊"
          />
          <template #fallback><BaseSkeleton height="220px" radius="md" /></template>
        </ClientOnly>
      </section>
    </template>
  </StudioShell>
</template>

<style scoped lang="scss">
.demo-note {
  font-size: rem(14px);
  color: color('text-muted');
}

.kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: space(3);

  @include bp(xl) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: space(4);
  }
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: space(2);
  padding: space(4);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');

  dt {
    font-size: rem(14px);
    color: color('text-muted');
  }

  &__value {
    font-family: var(--font-mono);
    font-size: rem(26px);
    font-weight: 500;
    line-height: 1.2;

    span {
      margin-left: 2px;
      font-size: rem(14px);
      color: color('text-muted');
    }
  }

  &__change {
    display: flex;
    align-items: center;
    gap: space(1);
    font-size: rem(13px);

    &.is-up {
      color: color('status-success-fg');
    }

    &.is-down {
      color: color('status-danger-fg');
    }
  }
}

.panel {
  display: flex;
  flex-direction: column;
  gap: space(4);
  padding: space(5);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');

  &__title {
    @include text('h3');
  }
}
</style>
