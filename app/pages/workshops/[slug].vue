<script setup lang="ts">
/**
 * 工作坊詳細頁（F-04）。ISR：第一次請求時渲染，CDN 快取 1 小時。
 * 找不到時拋出 404，伺服器回傳真正的 HTTP 404（不是 200 + 錯誤畫面），搜尋引擎才不會收錄。
 */
import { MapPin as IconMapPin, Share2 as IconShare } from 'lucide-vue-next'
import { LEVEL_LABELS } from '#shared/types/domain'
import { formatDate, formatDuration, formatPrice } from '#shared/utils/format'
import { catalogService } from '~/services/catalog.service'
import { useToastStore } from '~/stores/toast'
import { courseNode, faqNode, graph } from '#shared/utils/structured-data'

// 在同一種頁面之間切換（例如點相關工作坊）時重新建立元件，資料與捲動狀態不殘留
definePageMeta({ key: (route) => route.fullPath })

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const data = await usePageData(
  `workshop-${slug.value}`,
  () => catalogService.getWorkshop(slug.value),
  '找不到這堂工作坊',
)

const workshop = computed(() => data.value?.workshop)

usePageSeo(() => ({
  title: workshop.value?.title ?? '工作坊',
  description: workshop.value?.summary ?? '',
  path: `/workshops/${slug.value}`,
  image: workshop.value?.image?.src.replace('-640', '-1280'),
  imageAlt: workshop.value?.image?.alt,
}))

const { siteUrl } = useRuntimeConfig().public
useJsonLd('workshop', () =>
  workshop.value ? graph([courseNode(siteUrl, workshop.value), faqNode(workshop.value.faq)]) : {},
)

// 預約面板出現在畫面上、或已經捲過它時，隱藏底部預約列（避免重複，也不會蓋住頁尾）
const showMobileCta = ref(true)
let observer: IntersectionObserver | undefined
onMounted(() => {
  const panel = document.getElementById('booking-panel')
  if (!panel) return
  observer = new IntersectionObserver(([entry]) => {
    if (entry) showMobileCta.value = !entry.isIntersecting && entry.boundingClientRect.top > 0
  })
  observer.observe(panel)
})
onBeforeUnmount(() => observer?.disconnect())

function scrollToBooking() {
  const panel = document.getElementById('booking-panel')
  panel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // 把焦點移到第一個場次，鍵盤與螢幕閱讀器使用者也會跟著到達預約面板
  panel?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus({ preventScroll: true })
}

const toast = useToastStore()
async function share() {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title: workshop.value?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('已複製連結')
    }
  } catch (error) {
    // 使用者取消分享不算錯誤
    if ((error as DOMException).name !== 'AbortError') toast.error('無法分享，請手動複製網址')
  }
}
</script>

<template>
  <div v-if="workshop && data" class="container detail">
    <AppBreadcrumb
      :items="[
        { label: workshop.categoryName, to: `/categories/${workshop.category}` },
        { label: workshop.title },
      ]"
    />

    <div class="detail__gallery">
      <div class="detail__cover detail__cover--main">
        <WorkshopPhoto
          :image="workshop.image"
          :category="workshop.category"
          sizes="(min-width: 768px) 66vw, 100vw"
          priority
        />
      </div>
      <div class="detail__cover"><WorkshopCover :category="workshop.category" /></div>
    </div>

    <div class="detail__layout">
      <article class="detail__main">
        <header class="detail__header">
          <p class="detail__meta">
            <span
              class="category-dot"
              :class="`category-dot--${workshop.category}`"
              aria-hidden="true"
            />
            <NuxtLink :to="`/categories/${workshop.category}`">{{
              workshop.categoryName
            }}</NuxtLink>
            ·
            <NuxtLink :to="`/cities/${workshop.city}`">{{ workshop.cityName }}</NuxtLink>{{
              workshop.district
            }}
          </p>
          <h1 class="detail__title">{{ workshop.title }}</h1>
          <ul class="detail__facts">
            <li>
              ★ <strong>{{ workshop.rating.average.toFixed(1) }}</strong>（{{
                workshop.rating.count
              }}
              則評價）
            </li>
            <li>{{ formatDuration(workshop.durationMinutes) }}</li>
            <li>{{ LEVEL_LABELS[workshop.level] }}</li>
            <li>每班 {{ workshop.capacityPerSession }} 人</li>
          </ul>
          <div class="detail__actions">
            <FavoriteButton :slug="workshop.slug" :title="workshop.title" variant="labeled" />
            <BaseButton variant="secondary" @click="share">
              <IconShare :size="16" aria-hidden="true" />
              分享
            </BaseButton>
          </div>
        </header>

        <section class="detail__section" aria-labelledby="sec-intro">
          <h2 id="sec-intro">課程介紹</h2>
          <p class="detail__prose">{{ workshop.description }}</p>
        </section>

        <div class="detail__columns">
          <section aria-labelledby="sec-learn">
            <h2 id="sec-learn" class="detail__h3">你會學到</h2>
            <ul class="detail__bullets">
              <li v-for="item in workshop.learn" :key="item">{{ item }}</li>
            </ul>
          </section>
          <section aria-labelledby="sec-audience">
            <h2 id="sec-audience" class="detail__h3">適合對象</h2>
            <ul class="detail__bullets">
              <li v-for="item in workshop.audience" :key="item">{{ item }}</li>
            </ul>
          </section>
        </div>

        <section class="detail__section" aria-labelledby="sec-agenda">
          <h2 id="sec-agenda">課程流程</h2>
          <ol class="agenda">
            <li v-for="item in workshop.agenda" :key="item.offset" class="agenda__item">
              <span class="agenda__time">{{ item.offset }}</span>
              <span>{{ item.title }}</span>
            </li>
          </ol>
        </section>

        <section class="detail__section" aria-labelledby="sec-notes">
          <h2 id="sec-notes">注意事項</h2>
          <ul class="detail__bullets">
            <li v-for="note in workshop.notes" :key="note">{{ note }}</li>
          </ul>
        </section>

        <section class="instructor" aria-labelledby="sec-instructor">
          <span class="instructor__avatar" aria-hidden="true">{{
            workshop.instructor.name.slice(0, 1)
          }}</span>
          <div class="instructor__text">
            <p class="instructor__label">INSTRUCTOR</p>
            <h2 id="sec-instructor" class="detail__h3">{{ workshop.instructor.name }}</h2>
            <p class="instructor__bio">
              {{ workshop.instructor.studio }}・{{ workshop.instructor.title }}
            </p>
          </div>
          <NuxtLink :to="`/instructors/${workshop.instructor.slug}`">講師頁面 →</NuxtLink>
        </section>

        <section class="detail__section" aria-labelledby="sec-location">
          <h2 id="sec-location">地點</h2>
          <p class="detail__location">
            <IconMapPin :size="18" aria-hidden="true" />
            {{ workshop.address }}
          </p>
          <p class="detail__muted">示範資料不提供真實地址，報名後由開課者另行通知。</p>
        </section>

        <section class="detail__section" aria-labelledby="sec-reviews">
          <h2 id="sec-reviews">學員評價</h2>
          <ul class="reviews">
            <li v-for="review in workshop.reviews" :key="review.id" class="review">
              <p class="review__head">
                <strong>{{ review.author }}</strong>
                <span :aria-label="`${review.rating} 顆星`">{{ '★'.repeat(review.rating) }}</span>
                <time :datetime="review.date" class="detail__muted">{{
                  formatDate(review.date)
                }}</time>
              </p>
              <p>{{ review.body }}</p>
            </li>
          </ul>
        </section>

        <section class="detail__section" aria-labelledby="sec-faq">
          <h2 id="sec-faq">常見問題</h2>
          <div class="faq">
            <details v-for="item in workshop.faq" :key="item.question" class="faq__item">
              <summary class="faq__question">{{ item.question }}</summary>
              <p class="faq__answer">{{ item.answer }}</p>
            </details>
          </div>
        </section>
      </article>

      <aside id="booking-panel" class="detail__aside" aria-label="預約">
        <WorkshopBookingPanel :workshop="workshop" />
      </aside>
    </div>

    <!-- 手機版：預約面板在內容最下方，底部固定一條預約列，點擊後捲動到面板 -->
    <div v-show="showMobileCta" class="mobile-cta">
      <p class="mobile-cta__price">{{ formatPrice(workshop.price) }}<span>／人</span></p>
      <BaseButton @click="scrollToBooking">選擇場次</BaseButton>
    </div>

    <section v-if="data.related.length" class="detail__related" aria-labelledby="sec-related">
      <h2 id="sec-related">你可能也喜歡</h2>
      <ul class="related-grid">
        <li v-for="item in data.related" :key="item.id">
          <WorkshopCard :workshop="item" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  gap: space(6);
  padding-block: space(5) space(8);
  // 預留底部固定預約列的高度，避免遮住頁尾前的內容
  padding-bottom: calc(#{space(8)} + 72px);

  @include bp(lg) {
    padding-bottom: space(8);
  }

  &__gallery {
    display: grid;
    gap: space(3);
    height: 240px;

    @include bp(md) {
      grid-template-columns: 2fr 1fr;
      height: 360px;
    }
  }

  &__cover {
    display: none;
    overflow: hidden;
    border: 1.5px solid color('border-ink');
    border-radius: radius('lg');

    &--main {
      display: block;
    }

    @include bp(md) {
      display: block;
    }
  }

  &__layout {
    display: grid;
    gap: space(7);
    align-items: start;

    @include bp(lg) {
      grid-template-columns: minmax(0, 1fr) 360px;
    }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: space(7);
    min-width: 0;
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: space(3);
    padding-bottom: space(6);
    border-bottom: 1px solid color('border-subtle');
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(2);
    color: color('text-muted');
    font-size: rem(14px);
  }

  &__title {
    @include text('h1');
  }

  &__facts {
    display: flex;
    flex-wrap: wrap;
    gap: space(2) space(5);
    color: color('text-muted');
    font-size: rem(15px);

    strong {
      color: color('text-default');
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: space(3);
    margin-top: space(2);
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: space(3);
  }

  &__prose {
    @include text('body-lg');
    max-width: 68ch;
  }

  &__columns {
    display: grid;
    gap: space(6);

    @include bp(md) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    section {
      display: flex;
      flex-direction: column;
      gap: space(3);
    }
  }

  &__h3 {
    @include text('h3');
  }

  &__bullets {
    padding-left: space(5);
    list-style: disc;
    line-height: 1.9;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: space(2);
  }

  &__muted {
    color: color('text-muted');
    font-size: rem(14px);
  }

  &__aside {
    @include bp(lg) {
      position: sticky;
      top: space(4);
    }
  }

  &__related {
    display: flex;
    flex-direction: column;
    gap: space(5);
    padding-top: space(7);
    border-top: 1px solid color('border-subtle');
  }
}

.mobile-cta {
  position: fixed;
  inset: auto 0 0;
  z-index: z('header');
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: space(4);
  padding: space(3) space(4) calc(#{space(3)} + env(safe-area-inset-bottom));
  border-top: 1.5px solid color('border-ink');
  background: color('bg-surface');

  @include bp(lg) {
    display: none;
  }

  &__price {
    font-family: var(--font-mono);
    font-size: rem(18px);
    font-weight: 500;

    span {
      font-family: var(--font-body);
      font-size: rem(13px);
      color: color('text-muted');
    }
  }
}

.agenda {
  display: flex;
  flex-direction: column;
  margin-left: space(2);
  border-left: 2px solid color('border-subtle');

  &__item {
    display: flex;
    gap: space(4);
    padding: 0 0 space(4) space(5);

    &:last-child {
      padding-bottom: 0;
    }
  }

  &__time {
    width: 56px;
    flex: none;
    font-family: var(--font-mono);
    color: color('text-link');
  }
}

.instructor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: space(5);
  padding: space(5);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');

  &__avatar {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: radius('full');
    background: color('bg-ticket');
    font-family: var(--font-display);
    font-size: rem(28px);
    font-weight: 700;
  }

  &__text {
    flex: 1 1 200px;
    display: flex;
    flex-direction: column;
    gap: space(1);
  }

  &__label {
    font-family: var(--font-mono);
    font-size: rem(12px);
    color: color('text-muted');
  }

  &__bio {
    color: color('text-muted');
    font-size: rem(15px);
  }
}

.reviews {
  display: grid;
  gap: space(4);
}

.review {
  display: flex;
  flex-direction: column;
  gap: space(2);
  padding: space(4);
  border: 1px solid color('border-subtle');
  border-radius: radius('md');
  background: color('bg-surface');

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(3);
  }
}

.faq {
  display: flex;
  flex-direction: column;
  border-top: 1px solid color('border-subtle');

  &__item {
    border-bottom: 1px solid color('border-subtle');
  }

  &__question {
    display: flex;
    align-items: center;
    min-height: 52px;
    padding-block: space(3);
    font-weight: 500;
    cursor: pointer;
  }

  &__answer {
    padding-bottom: space(4);
    color: color('text-muted');
  }
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: space(5);
}
</style>
