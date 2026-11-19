<script setup lang="ts">
/**
 * 講師頁（F-05），ISR。找不到時回傳 HTTP 404。
 */
import { catalogService } from '~/services/catalog.service'
import { CATEGORY_NAMES } from '~/utils/labels'

// 在同一種頁面之間切換（例如點相關工作坊）時重新建立元件，資料與捲動狀態不殘留
definePageMeta({ key: (route) => route.fullPath })

const route = useRoute()
const slug = String(route.params.slug)

const data = await usePageData(
  `instructor-${slug}`,
  () => catalogService.getInstructor(slug),
  '找不到這位講師',
)

useSeoMeta({
  title: () =>
    data.value ? `${data.value.instructor.name}｜${data.value.instructor.studio}` : '講師',
  description: () => data.value?.instructor.bio,
})
</script>

<template>
  <div v-if="data" class="container instructor">
    <AppBreadcrumb
      :items="[{ label: '講師', to: '/instructors' }, { label: data.instructor.name }]"
    />
    <header class="instructor__header">
      <span class="instructor__avatar" aria-hidden="true">{{
        data.instructor.name.slice(0, 1)
      }}</span>
      <div class="instructor__intro">
        <p class="instructor__label">INSTRUCTOR</p>
        <h1>{{ data.instructor.name }}</h1>
        <p class="instructor__meta">
          {{ data.instructor.studio }}・{{ data.instructor.title }}・教學
          {{ data.instructor.yearsTeaching }} 年
        </p>
        <p class="instructor__meta">
          專長：<span v-for="(c, i) in data.instructor.categories" :key="c"
            >{{ i ? '、' : ''
            }}<NuxtLink :to="`/categories/${c}`">{{ CATEGORY_NAMES[c] }}</NuxtLink></span
          >
        </p>
      </div>
    </header>
    <section class="instructor__section" aria-labelledby="bio-title">
      <h2 id="bio-title">關於講師</h2>
      <p class="instructor__bio">{{ data.instructor.bio }}</p>
    </section>
    <section class="instructor__section" aria-labelledby="ws-title">
      <h2 id="ws-title">開設的工作坊（{{ data.workshops.length }}）</h2>
      <ul class="instructor__grid">
        <li v-for="workshop in data.workshops" :key="workshop.id">
          <WorkshopCard :workshop="workshop" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.instructor {
  display: flex;
  flex-direction: column;
  gap: space(6);
  padding-block: space(5) space(8);

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(5);
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 96px;
    height: 96px;
    border: 1.5px solid color('border-ink');
    border-radius: radius('full');
    background: color('bg-ticket');
    font-family: var(--font-display);
    font-size: rem(40px);
    font-weight: 700;
  }

  &__intro {
    display: flex;
    flex-direction: column;
    gap: space(1);
  }

  &__label {
    font-family: var(--font-mono);
    font-size: rem(12px);
    letter-spacing: 0.12em;
    color: color('text-muted');
  }

  &__meta {
    color: color('text-muted');
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: space(4);

    h2 {
      @include text('h3');
    }
  }

  &__bio {
    @include text('body-lg');
    max-width: 68ch;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: space(5);
  }
}
</style>
