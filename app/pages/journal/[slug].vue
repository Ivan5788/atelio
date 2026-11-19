<script setup lang="ts">
/**
 * 文章頁（F-06），Prerender。
 * 文章內容是結構化區塊（段落、標題、清單、提示），以一般模板渲染，不使用 v-html（C-07）。
 */
import { formatDate } from '#shared/utils/format'
import { catalogService } from '~/services/catalog.service'
import { CATEGORY_NAMES } from '~/utils/labels'

// 在同一種頁面之間切換（例如點相關工作坊）時重新建立元件，資料與捲動狀態不殘留
definePageMeta({ key: (route) => route.fullPath })

const route = useRoute()
const slug = String(route.params.slug)

const data = await usePageData(
  `article-${slug}`,
  () => catalogService.getArticle(slug),
  '找不到這篇文章',
)

useSeoMeta({
  title: () => data.value?.article.title ?? '知識專欄',
  description: () => data.value?.article.excerpt,
})
</script>

<template>
  <div v-if="data" class="container article-page">
    <AppBreadcrumb
      :items="[{ label: '知識專欄', to: '/journal' }, { label: data.article.title }]"
    />
    <article class="article">
      <header class="article__header">
        <p class="article__meta">{{ data.article.kind }} · {{ data.article.readMinutes }} MIN</p>
        <h1>{{ data.article.title }}</h1>
        <p class="article__byline">
          {{ data.article.author }}・發布於
          <time :datetime="data.article.publishedAt">{{
            formatDate(data.article.publishedAt)
          }}</time>
          ・更新於
          <time :datetime="data.article.updatedAt">{{ formatDate(data.article.updatedAt) }}</time>
        </p>
      </header>
      <div class="article__body">
        <template v-for="(block, index) in data.article.body" :key="index">
          <h2 v-if="block.type === 'h2'">{{ block.text }}</h2>
          <p v-else-if="block.type === 'p'">{{ block.text }}</p>
          <ul v-else-if="block.type === 'ul'">
            <li v-for="item in block.items" :key="item">{{ item }}</li>
          </ul>
          <aside v-else-if="block.type === 'tip'" class="article__tip">
            <strong>小提醒</strong>
            <p>{{ block.text }}</p>
          </aside>
        </template>
      </div>
      <footer class="article__footer">
        相關分類：<NuxtLink :to="`/categories/${data.article.category}`"
          >{{ CATEGORY_NAMES[data.article.category] }}工作坊</NuxtLink
        >
      </footer>
    </article>

    <section
      v-if="data.related.length"
      class="article-page__related"
      aria-labelledby="related-title"
    >
      <h2 id="related-title">文中提到的工作坊</h2>
      <ul class="article-page__grid">
        <li v-for="workshop in data.related" :key="workshop.id">
          <WorkshopCard :workshop="workshop" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.article-page {
  display: flex;
  flex-direction: column;
  gap: space(7);
  padding-block: space(5) space(8);

  &__related {
    display: flex;
    flex-direction: column;
    gap: space(4);
    padding-top: space(6);
    border-top: 1px solid color('border-subtle');

    h2 {
      @include text('h3');
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: space(5);
  }
}

.article {
  display: flex;
  flex-direction: column;
  gap: space(6);
  max-width: 720px;

  &__header {
    display: flex;
    flex-direction: column;
    gap: space(3);
  }

  &__meta {
    font-family: var(--font-mono);
    font-size: rem(12px);
    letter-spacing: 0.12em;
    color: color('text-muted');
  }

  &__byline {
    color: color('text-muted');
    font-size: rem(14px);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: space(4);
    @include text('body-lg');

    h2 {
      margin-top: space(4);
      @include text('h3');
    }

    ul {
      padding-left: space(5);
      list-style: disc;
    }
  }

  &__tip {
    display: flex;
    flex-direction: column;
    gap: space(1);
    padding: space(4) space(5);
    border-left: 4px solid color('action-accent-fg');
    border-radius: 0 radius('md') radius('md') 0;
    background: color('bg-selected');
  }

  &__footer {
    padding-top: space(4);
    border-top: 1px solid color('border-subtle');
    color: color('text-muted');
  }
}
</style>
