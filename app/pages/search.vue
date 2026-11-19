<script setup lang="ts">
/**
 * 全站搜尋（F-07）：工作坊、講師、文章分組顯示。搜尋結果頁不索引（docs/02-sitemap.md）。
 */
import { catalogService } from '~/services/catalog.service'

useSeoMeta({ title: '搜尋', robots: 'noindex, follow' })

const route = useRoute()
const q = computed(() =>
  typeof route.query.q === 'string' ? route.query.q.trim().slice(0, 50) : '',
)
const input = ref(q.value)
watch(q, (value) => (input.value = value))

const { data, status, error, refresh } = await useAsyncData(
  'search',
  () => (q.value ? catalogService.search(q.value) : Promise.resolve(null)),
  { watch: [q] },
)

const total = computed(() =>
  data.value
    ? data.value.workshops.length + data.value.instructors.length + data.value.articles.length
    : 0,
)

function onSubmit() {
  navigateTo({ query: input.value.trim() ? { q: input.value.trim() } : {} })
}
</script>

<template>
  <div class="container search-page">
    <h1>搜尋</h1>
    <form class="search-page__form" role="search" @submit.prevent="onSubmit">
      <BaseInput
        v-model="input"
        label="搜尋工作坊、講師、文章"
        hide-label
        type="search"
        placeholder="例如：陶、皮革、陳以禾"
        maxlength="50"
        class="search-page__input"
      />
      <BaseButton type="submit" size="lg">搜尋</BaseButton>
    </form>

    <p v-if="q && data" role="status" class="search-page__status">
      「{{ q }}」共找到 <strong>{{ total }}</strong> 筆結果
    </p>

    <BaseEmptyState
      v-if="error"
      tone="error"
      title="搜尋暫時無法使用"
      description="請稍後再試一次。"
    >
      <BaseButton variant="secondary" @click="refresh()">重新搜尋</BaseButton>
    </BaseEmptyState>

    <BaseEmptyState
      v-else-if="!q"
      title="想找什麼課程？"
      description="輸入關鍵字，可以同時搜尋工作坊、講師與知識文章。"
    />

    <BaseEmptyState
      v-else-if="data && total === 0 && status !== 'pending'"
      title="沒有找到相關結果"
      description="換個關鍵字試試，或直接瀏覽所有工作坊。"
    >
      <BaseButton variant="secondary" to="/workshops">瀏覽所有工作坊</BaseButton>
    </BaseEmptyState>

    <template v-else-if="data">
      <section
        v-if="data.workshops.length"
        aria-labelledby="result-workshops"
        class="search-page__group"
      >
        <h2 id="result-workshops">工作坊（{{ data.workshops.length }}）</h2>
        <ul class="search-page__grid">
          <li v-for="workshop in data.workshops" :key="workshop.id">
            <WorkshopCard :workshop="workshop" />
          </li>
        </ul>
      </section>
      <section
        v-if="data.instructors.length"
        aria-labelledby="result-instructors"
        class="search-page__group"
      >
        <h2 id="result-instructors">講師（{{ data.instructors.length }}）</h2>
        <ul class="search-page__list">
          <li v-for="instructor in data.instructors" :key="instructor.slug">
            <NuxtLink :to="`/instructors/${instructor.slug}`">{{ instructor.name }}</NuxtLink>
            <span class="search-page__muted">・{{ instructor.studio }}</span>
          </li>
        </ul>
      </section>
      <section
        v-if="data.articles.length"
        aria-labelledby="result-articles"
        class="search-page__group"
      >
        <h2 id="result-articles">文章（{{ data.articles.length }}）</h2>
        <ul class="search-page__list">
          <li v-for="article in data.articles" :key="article.slug">
            <NuxtLink :to="`/journal/${article.slug}`">{{ article.title }}</NuxtLink>
            <p class="search-page__muted">{{ article.excerpt }}</p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.search-page {
  display: flex;
  flex-direction: column;
  gap: space(5);
  padding-block: space(6) space(8);

  &__form {
    display: flex;
    flex-wrap: wrap;
    gap: space(3);
    align-items: flex-end;
  }

  &__input {
    flex: 1 1 280px;
  }

  &__status strong {
    font-family: var(--font-mono);
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: space(4);

    h2 {
      @include text('h3');
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
    gap: space(5);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: space(3);
  }

  &__muted {
    color: color('text-muted');
    font-size: rem(14px);
  }
}
</style>
