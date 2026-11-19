<script setup lang="ts">
/**
 * 講師列表（F-05），Prerender。
 */
import { catalogService } from '~/services/catalog.service'
import { CATEGORY_NAMES } from '~/utils/labels'

useSeoMeta({
  title: '講師',
  description: 'Atelio 的工作坊講師與工作室介紹：陶藝、皮革、花藝、版畫、書法、木工、染織與插畫。',
})

const { data: instructors } = await useAsyncData('instructors', () =>
  catalogService.listInstructors(),
)
</script>

<template>
  <div class="container instructors">
    <AppBreadcrumb :items="[{ label: '講師' }]" />
    <header class="instructors__header">
      <h1>講師</h1>
      <p class="instructors__lead">
        每一位講師都有自己的工作室與教學方式。以下為示範用的虛構講師。
      </p>
    </header>
    <ul class="instructors__grid">
      <li v-for="instructor in instructors" :key="instructor.slug" class="person">
        <span class="person__avatar" aria-hidden="true">{{ instructor.name.slice(0, 1) }}</span>
        <div class="person__body">
          <h2 class="person__name">
            <NuxtLink :to="`/instructors/${instructor.slug}`" class="person__link">{{
              instructor.name
            }}</NuxtLink>
          </h2>
          <p class="person__meta">{{ instructor.studio }}・{{ instructor.title }}</p>
          <p class="person__tags">
            <span v-for="c in instructor.categories" :key="c" class="person__tag">
              <span class="category-dot" :class="`category-dot--${c}`" aria-hidden="true" />{{
                CATEGORY_NAMES[c]
              }}
            </span>
            <span class="person__tag">教學 {{ instructor.yearsTeaching }} 年</span>
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.instructors {
  display: flex;
  flex-direction: column;
  gap: space(5);
  padding-block: space(5) space(8);

  &__header {
    display: flex;
    flex-direction: column;
    gap: space(2);
  }

  &__lead {
    color: color('text-muted');
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: space(4);
  }
}

.person {
  position: relative;
  display: flex;
  gap: space(4);
  padding: space(5);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');

  &:hover {
    border-color: color('border-ink');
  }

  &:has(.person__link:focus-visible) {
    outline: 2px solid color('border-focus');
    outline-offset: 2px;
  }

  &__avatar {
    display: grid;
    flex: none;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: radius('full');
    background: color('bg-ticket');
    font-family: var(--font-display);
    font-size: rem(22px);
    font-weight: 700;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: space(1);
  }

  &__name {
    @include text('h4');
  }

  &__link {
    color: color('text-default');
    text-decoration: none;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
    }

    &:focus-visible {
      outline: none;
    }
  }

  &__meta {
    color: color('text-muted');
    font-size: rem(14px);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: space(2);
    margin-top: space(2);
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    gap: space(1);
    padding: 2px space(2);
    border-radius: radius('full');
    background: color('bg-sunken');
    font-size: rem(13px);
  }
}
</style>
