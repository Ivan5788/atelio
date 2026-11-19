<script setup lang="ts">
/**
 * 工作坊卡片（票根造型，docs/06-design-system.md）。
 *
 * 可點擊區域：標題連結以 ::after 撐滿整張卡片，整張卡都能點，
 * 但螢幕閱讀器只會讀到一個有意義的連結（標題），不會重複讀出「連結、連結、連結」。
 * 收藏按鈕的 z-index 較高，點擊不會觸發卡片連結。
 */
import type { WorkshopSummary } from '#shared/types/domain'
import { LEVEL_LABELS } from '#shared/types/domain'
import { formatDuration, formatPrice, seatsLabel, ticketDate } from '#shared/utils/format'

const props = withDefaults(defineProps<{ workshop: WorkshopSummary; headingLevel?: 2 | 3 }>(), {
  headingLevel: 3,
})

const ticket = computed(() =>
  props.workshop.nextSession ? ticketDate(props.workshop.nextSession.startsAt) : null,
)
const seats = computed(() =>
  props.workshop.nextSession ? seatsLabel(props.workshop.nextSession.seatsLeft) : null,
)
</script>

<template>
  <article class="card">
    <div class="card__cover">
      <WorkshopCover :category="workshop.category" />
      <FavoriteButton :slug="workshop.slug" :title="workshop.title" class="card__favorite" />
    </div>
    <div class="card__body">
      <div class="card__info">
        <p class="card__meta">
          <span
            class="category-dot"
            :class="`category-dot--${workshop.category}`"
            aria-hidden="true"
          />
          {{ workshop.categoryName }} · {{ workshop.cityName }}{{ workshop.district }}
        </p>
        <component :is="`h${headingLevel}`" class="card__title">
          <NuxtLink :to="`/workshops/${workshop.slug}`" class="card__link">{{
            workshop.title
          }}</NuxtLink>
        </component>
        <p class="card__detail">
          <span aria-label="評分">★ {{ workshop.rating.average.toFixed(1) }}</span>
          <span>（{{ workshop.rating.count }}）</span>
          · {{ LEVEL_LABELS[workshop.level] }} · {{ formatDuration(workshop.durationMinutes) }}
        </p>
        <p class="card__price">{{ formatPrice(workshop.price) }}</p>
      </div>
      <div class="card__stub">
        <template v-if="ticket && seats">
          <span class="card__stub-small">{{ ticket.mon }}</span>
          <span class="card__stub-day">{{ ticket.day }}</span>
          <span class="card__stub-small">{{ ticket.weekday }}</span>
          <span class="card__seats" :class="`is-${seats.tone}`">{{ seats.text }}</span>
          <span class="visually-hidden">最近場次</span>
        </template>
        <span v-else class="card__stub-small">暫無<br />場次</span>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.card {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: radius('lg');
  background: color('bg-surface');
  @include sticker;

  // 鍵盤聚焦標題連結時，整張卡片顯示焦點框
  &:has(.card__link:focus-visible) {
    outline: 2px solid color('border-focus');
    outline-offset: 3px;
  }

  &__cover {
    position: relative;
    aspect-ratio: 16 / 10;
    border-bottom: 1.5px solid color('border-ink');
  }

  &__favorite {
    position: absolute;
    top: space(3);
    right: space(3);
    z-index: 2;
  }

  &__body {
    display: flex;
    flex: 1;
  }

  &__info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: space(1);
    min-width: 0;
    padding: space(4);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: space(2);
    font-size: rem(13px);
    color: color('text-muted');
  }

  &__title {
    @include text('h4');
    line-height: 1.4;
  }

  &__link {
    color: color('text-default');
    text-decoration: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    &:hover {
      color: color('text-default');
      text-decoration: underline;
    }

    // 焦點框改畫在卡片上（見 :has 規則）
    &:focus-visible {
      outline: none;
    }
  }

  &__detail {
    font-size: rem(13px);
    color: color('text-muted');
  }

  &__price {
    margin-top: auto;
    padding-top: space(2);
    font-family: var(--font-mono);
    font-size: rem(15px);
    font-weight: 500;
  }

  // 票根：虛線分隔，奶油色底
  &__stub {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 72px;
    border-left: 2px dashed color('border-dashed');
    background: color('bg-ticket');
    font-family: var(--font-mono);
    text-align: center;
  }

  &__stub-small {
    font-size: rem(12px);
  }

  &__stub-day {
    font-size: rem(26px);
    line-height: 1;
  }

  &__seats {
    margin-top: space(2);
    font-size: rem(12px);

    &.is-warning {
      color: color('status-warning-fg');
      font-weight: 700;
    }

    &.is-muted {
      color: color('text-muted');
    }

    &.is-full {
      color: color('status-danger-fg');
    }
  }
}
</style>
