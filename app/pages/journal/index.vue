<script setup lang="ts">
/**
 * 知識專欄（F-06），Prerender。
 */
import { formatDate } from '#shared/utils/format'
import { catalogService } from '~/services/catalog.service'
import { blogNode, graph } from '#shared/utils/structured-data'

usePageSeo({
  title: '知識專欄',
  description:
    '手作課程的準備、比較與保養指南：第一次上陶藝課、手捏與拉坯的差別、皮件保養與挑選工作坊。',
  path: '/journal',
})

const { data: articles } = await useAsyncData('articles', () => catalogService.listArticles())

const { siteUrl } = useRuntimeConfig().public
useJsonLd('blog', () => graph([blogNode(siteUrl, articles.value ?? [])]))
</script>

<template>
  <div class="container journal">
    <AppBreadcrumb :items="[{ label: '知識專欄' }]" />
    <header class="journal__header">
      <h1>知識專欄</h1>
      <p class="journal__lead">
        上課前的準備、課程比較與作品保養，讓第一次參加工作坊的人也能安心。
      </p>
    </header>
    <ul class="journal__list">
      <li v-for="article in articles" :key="article.slug" class="entry">
        <p class="entry__meta">
          {{ article.kind }} · {{ article.readMinutes }} MIN ·
          <time :datetime="article.updatedAt">更新於 {{ formatDate(article.updatedAt) }}</time>
        </p>
        <h2 class="entry__title">
          <NuxtLink :to="`/journal/${article.slug}`">{{ article.title }}</NuxtLink>
        </h2>
        <p class="entry__excerpt">{{ article.excerpt }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.journal {
  display: flex;
  flex-direction: column;
  gap: space(5);
  max-width: 880px;
  padding-block: space(5) space(8);

  &__header {
    display: flex;
    flex-direction: column;
    gap: space(2);
  }

  &__lead {
    color: color('text-muted');
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: space(5);
  }
}

.entry {
  display: flex;
  flex-direction: column;
  gap: space(2);
  padding-top: space(4);
  border-top: 1px solid color('border-ink');

  &__meta {
    font-family: var(--font-mono);
    font-size: rem(12px);
    color: color('text-muted');
  }

  &__title {
    @include text('h3');

    a {
      color: color('text-default');
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__excerpt {
    color: color('text-muted');
  }
}
</style>
