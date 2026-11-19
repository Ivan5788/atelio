<script setup lang="ts">
/**
 * 分類頁與城市頁共用的落地頁版型（F-03）：獨立的介紹文字 + 該分類／城市的所有工作坊。
 * 這兩種頁面是 SEO 的主要入口，所以內容在伺服器渲染時就完整輸出。
 */
import type { WorkshopSummary } from '#shared/types/domain'

defineProps<{
  title: string
  intro: string
  breadcrumbLabel: string
  workshops: WorkshopSummary[]
  listLink: { path: string; query: Record<string, string> }
  related: { label: string; to: string }[]
  relatedTitle: string
}>()
</script>

<template>
  <div class="container landing">
    <AppBreadcrumb
      :items="[{ label: '探索工作坊', to: '/workshops' }, { label: breadcrumbLabel }]"
    />
    <header class="landing__header">
      <slot name="badge" />
      <h1>{{ title }}</h1>
      <p class="landing__intro">{{ intro }}</p>
    </header>

    <section class="landing__section" aria-labelledby="landing-list">
      <div class="landing__head">
        <h2 id="landing-list">共 {{ workshops.length }} 堂工作坊</h2>
        <NuxtLink :to="listLink">用更多條件篩選 →</NuxtLink>
      </div>
      <ul class="landing__grid">
        <li v-for="(workshop, index) in workshops" :key="workshop.id">
          <WorkshopCard :workshop="workshop" :priority="index === 0" />
        </li>
      </ul>
    </section>

    <nav class="landing__related" :aria-labelledby="'landing-related'">
      <h2 id="landing-related" class="landing__related-title">{{ relatedTitle }}</h2>
      <ul class="landing__chips">
        <li v-for="item in related" :key="item.to">
          <NuxtLink :to="item.to" class="landing__chip">{{ item.label }}</NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.landing {
  display: flex;
  flex-direction: column;
  gap: space(6);
  padding-block: space(5) space(8);

  &__header {
    display: flex;
    flex-direction: column;
    gap: space(3);
    max-width: 48em;
  }

  &__intro {
    @include text('body-lg');
    color: color('text-muted');
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: space(5);
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: space(3);

    h2 {
      @include text('h3');
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: space(5);
  }

  &__related {
    display: flex;
    flex-direction: column;
    gap: space(3);
    padding-top: space(6);
    border-top: 1px solid color('border-subtle');
  }

  &__related-title {
    @include text('h4');
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: space(2);
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 space(4);
    border: 1px solid color('border-strong');
    border-radius: radius('full');
    background: color('bg-surface');
    color: color('text-default');
    text-decoration: none;

    &:hover {
      border-color: color('border-ink');
      color: color('text-default');
    }
  }
}
</style>
