<script setup lang="ts">
/**
 * 首頁（F-01）。ISR 每小時重新產生（場次日期依當下時間計算，見 nuxt.config.ts）。
 * 三個 API 以 Promise.all 平行請求，伺服器渲染時一次取得、序列化進 HTML，
 * 瀏覽器 hydration 時直接使用，不會重複請求（ADR-004）。
 */
import { catalogService } from '~/services/catalog.service'
import { CITY_SLUGS } from '#shared/types/domain'
import { CITY_NAMES } from '~/utils/labels'
import { workshopImageFor } from '#shared/data/workshop-images'

useSeoMeta({
  title: '探索並預約設計與手作工作坊',
  description: '比較全台陶藝、皮革、花藝、版畫工作坊的時間、價格與剩餘名額，線上直接預約。',
})

const { data, error, refresh } = await useAsyncData('home', async () => {
  const [upcoming, categories, articles] = await Promise.all([
    catalogService.listWorkshops({ sort: 'upcoming', pageSize: 4 }),
    catalogService.listCategories(),
    catalogService.listArticles(),
  ])
  return { upcoming: upcoming.items, categories, articles: articles.slice(0, 2) }
})

const keyword = ref('')
const city = ref('')
const popular = ['拉坯', '皮夾', '乾燥花', '活版印刷', '藍染']
const cityOptions = CITY_SLUGS.map((slug) => ({ value: slug, label: CITY_NAMES[slug] }))

function onSearch() {
  navigateTo({
    path: '/workshops',
    query: { q: keyword.value.trim() || undefined, city: city.value || undefined },
  })
}

// 首頁主視覺：拉坯、皮革工具、花束三張示意照片
const heroImages = ['w03', 'w05', 'w08'].map((id) => workshopImageFor(id))

const steps = [
  {
    title: '比較課程',
    body: '時間、地點、價格、難度與剩餘名額集中在一頁，不必在社群私訊之間來回詢問。',
  },
  { title: '線上預約', body: '選擇場次與人數，填寫聯絡資料，三個步驟完成預約，名額即時更新。' },
  { title: '帶作品回家', body: '上完課留下評價，讓下一位學員更容易找到適合自己的工作坊。' },
]
</script>

<template>
  <div class="home">
    <section class="container hero">
      <div class="hero__text">
        <p class="overline">CRAFT WORKSHOPS · TAIWAN</p>
        <h1 class="hero__title">找一個週末，<br />親手做點什麼</h1>
        <p class="hero__lead">
          陶藝、皮革、花藝、版畫——比較全台工作坊的時間、價格與剩餘名額，線上直接預約。
        </p>
        <form class="hero__search" role="search" @submit.prevent="onSearch">
          <label for="hero-q" class="visually-hidden">想學什麼</label>
          <input
            id="hero-q"
            v-model="keyword"
            type="search"
            class="hero__input"
            placeholder="想學什麼？例如：拉坯、皮夾"
            maxlength="50"
          />
          <label for="hero-city" class="visually-hidden">城市</label>
          <select id="hero-city" v-model="city" class="hero__select">
            <option value="">所有城市</option>
            <option v-for="option in cityOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <BaseButton type="submit" size="lg" class="hero__submit">搜尋</BaseButton>
        </form>
        <div class="hero__popular">
          <span>熱門搜尋</span>
          <NuxtLink
            v-for="word in popular"
            :key="word"
            :to="{ path: '/workshops', query: { q: word } }"
          >
            {{ word }}
          </NuxtLink>
        </div>
      </div>
      <div class="hero__art" aria-hidden="true">
        <div class="hero__tile hero__tile--tall">
          <WorkshopPhoto
            :image="heroImages[0] ?? null"
            category="ceramics"
            sizes="(min-width: 1024px) 280px, 50vw"
            priority
            decorative
          />
        </div>
        <div class="hero__tile">
          <WorkshopPhoto
            :image="heroImages[1] ?? null"
            category="leathercraft"
            sizes="(min-width: 1024px) 280px, 50vw"
            decorative
          />
        </div>
        <div class="hero__tile">
          <WorkshopPhoto
            :image="heroImages[2] ?? null"
            category="floral"
            sizes="(min-width: 1024px) 280px, 50vw"
            decorative
          />
        </div>
      </div>
    </section>

    <BaseEmptyState
      v-if="error"
      class="container"
      tone="error"
      title="內容暫時無法載入"
      description="可能是網路不穩或伺服器忙碌，請稍後再試。"
    >
      <BaseButton variant="secondary" @click="refresh()">重新載入</BaseButton>
    </BaseEmptyState>

    <template v-else-if="data">
      <section class="section section--bordered" aria-labelledby="home-categories">
        <div class="container section__inner">
          <h2 id="home-categories">依分類探索</h2>
          <ul class="categories">
            <li v-for="category in data.categories" :key="category.slug">
              <NuxtLink :to="`/categories/${category.slug}`" class="category-tile">
                <span
                  class="category-tile__dot"
                  :class="`category-dot--${category.slug}`"
                  aria-hidden="true"
                />
                <span class="category-tile__text">
                  <strong>{{ category.name }}</strong>
                  <span class="category-tile__count">{{ category.workshopCount }} 堂</span>
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>

      <section class="container section__inner" aria-labelledby="home-upcoming">
        <div class="section__head">
          <h2 id="home-upcoming">近期還有名額</h2>
          <NuxtLink to="/workshops">看全部工作坊 →</NuxtLink>
        </div>
        <ul class="card-grid">
          <li v-for="workshop in data.upcoming" :key="workshop.id">
            <WorkshopCard :workshop="workshop" />
          </li>
        </ul>
      </section>

      <section class="section section--surface" aria-labelledby="home-how">
        <div class="container section__inner">
          <h2 id="home-how">Atelio 怎麼運作</h2>
          <ol class="steps">
            <li v-for="(step, index) in steps" :key="step.title" class="steps__item">
              <span class="steps__number" aria-hidden="true">{{
                String(index + 1).padStart(2, '0')
              }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.body }}</p>
            </li>
          </ol>
        </div>
      </section>

      <section class="container section__inner home__bottom">
        <div class="journal" aria-labelledby="home-journal">
          <div class="section__head">
            <h2 id="home-journal">知識專欄</h2>
            <NuxtLink to="/journal">所有文章 →</NuxtLink>
          </div>
          <article v-for="article in data.articles" :key="article.slug" class="journal__item">
            <p class="overline">{{ article.kind }} · {{ article.readMinutes }} MIN</p>
            <h3>
              <NuxtLink :to="`/journal/${article.slug}`" class="journal__link">{{
                article.title
              }}</NuxtLink>
            </h3>
            <p class="journal__excerpt">{{ article.excerpt }}</p>
          </article>
        </div>
        <aside class="organizer" aria-labelledby="home-organizer">
          <p class="overline">FOR ORGANIZERS</p>
          <h2 id="home-organizer" class="organizer__title">你是開課者嗎？</h2>
          <p>在 Studio 後台上架課程、管理場次，並查看報名趨勢。</p>
          <BaseButton variant="secondary" to="/for-organizers">了解 Studio 後台</BaseButton>
        </aside>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.overline {
  font-family: var(--font-mono);
  font-size: rem(12px);
  letter-spacing: 0.12em;
  color: color('text-muted');
}

.hero {
  display: grid;
  gap: space(7);
  align-items: center;
  padding-block: space(7) space(8);

  @include bp(lg) {
    grid-template-columns: 1.1fr 1fr;
    padding-block: space(8);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: space(5);
    min-width: 0;
  }

  &__title {
    @include text('display');
  }

  &__lead {
    @include text('body-lg');
    max-width: 34em;
    color: color('text-muted');
  }

  &__search {
    display: grid;
    grid-template-columns: 1fr;
    gap: space(2);
    padding: space(2);
    border: 1px solid color('border-strong');
    border-radius: radius('lg');
    background: color('bg-surface');

    @include bp(md) {
      grid-template-columns: 1fr auto auto;
      align-items: center;
    }
  }

  &__input,
  &__select {
    min-height: 48px;
    padding: 0 space(3);
    border: none;
    background: transparent;
    color: color('text-default');
    font-size: rem(16px);
  }

  &__select {
    border-top: 1px solid color('border-subtle');

    @include bp(md) {
      border-top: none;
      border-left: 1px solid color('border-subtle');
    }
  }

  &__popular {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(2) space(4);
    font-size: rem(14px);

    span {
      color: color('text-muted');
    }

    a {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
    }
  }

  &__art {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(140px, 1fr));
    gap: space(4);

    @include bp(lg) {
      grid-template-rows: repeat(2, 200px);
    }
  }

  &__tile {
    overflow: hidden;
    border: 1.5px solid color('border-ink');
    border-radius: radius('lg');

    &--tall {
      grid-row: span 2;
    }
  }
}

.section {
  &--bordered {
    border-top: 1px solid color('border-subtle');
  }

  &--surface {
    border-block: 1px solid color('border-subtle');
    background: color('bg-surface');
  }

  &__inner {
    display: flex;
    flex-direction: column;
    gap: space(5);
    padding-block: space(7);
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: space(3);
  }
}

.categories {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: space(3);

  @include bp(md) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: space(4);
  }
}

.category-tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: space(5);
  height: 100%;
  min-height: 120px;
  padding: space(4);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');
  color: color('text-default');
  text-decoration: none;

  @include motion-safe {
    transition:
      border-color duration('fast'),
      transform duration('fast');
  }

  &:hover {
    border-color: color('border-ink');
    color: color('text-default');
    transform: translateY(-2px);
  }

  &__dot {
    width: 32px;
    height: 32px;
    border-radius: radius('full');
    box-shadow: inset 0 0 0 1px rgb(93 73 62 / 0.18);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      font-weight: 500;
    }
  }

  &__count {
    font-family: var(--font-mono);
    font-size: rem(12px);
    color: color('text-muted');
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: space(5);
}

.steps {
  display: grid;
  gap: space(6);

  @include bp(md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: space(2);
    padding-top: space(4);
    border-top: 1px solid color('border-ink');

    p {
      color: color('text-muted');
    }
  }

  &__number {
    font-family: var(--font-mono);
    color: color('text-link');
  }
}

.home__bottom {
  display: grid;
  gap: space(7);

  @include bp(lg) {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }
}

.journal {
  display: flex;
  flex-direction: column;
  gap: space(5);

  &__item {
    display: flex;
    flex-direction: column;
    gap: space(2);
    padding-top: space(4);
    border-top: 1px solid color('border-ink');
  }

  &__link {
    color: color('text-default');
    text-decoration: none;

    &:hover {
      text-decoration: underline;
      color: color('text-default');
    }
  }

  &__excerpt {
    color: color('text-muted');
  }
}

.organizer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: space(4);
  padding: space(6);
  border-radius: radius('lg');
  background: color('bg-organizer');

  .overline {
    color: color('text-default');
  }

  &__title {
    @include text('h2');
  }
}
</style>
