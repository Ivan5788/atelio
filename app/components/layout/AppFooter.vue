<script setup lang="ts">
/**
 * 頁尾：分類與城市落地頁的內部連結（SEO 內部連結策略，docs/02-sitemap.md §4）＋作品聲明。
 */
import { CATEGORY_SLUGS, CITY_SLUGS } from '#shared/types/domain'
import { CATEGORY_NAMES, CITY_NAMES } from '~/utils/labels'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__grid">
        <div class="footer__brand">
          <NuxtLink to="/" class="footer__logo">Atelio</NuxtLink>
          <p>探索並預約設計與手作工作坊。</p>
        </div>
        <nav aria-labelledby="footer-categories">
          <h2 id="footer-categories" class="footer__heading">分類</h2>
          <ul class="footer__list">
            <li v-for="slug in CATEGORY_SLUGS" :key="slug">
              <NuxtLink :to="`/categories/${slug}`">{{ CATEGORY_NAMES[slug] }}</NuxtLink>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-cities">
          <h2 id="footer-cities" class="footer__heading">城市</h2>
          <ul class="footer__list">
            <li v-for="slug in CITY_SLUGS" :key="slug">
              <NuxtLink :to="`/cities/${slug}`">{{ CITY_NAMES[slug] }}</NuxtLink>
            </li>
          </ul>
        </nav>
        <nav aria-labelledby="footer-about">
          <h2 id="footer-about" class="footer__heading">關於</h2>
          <ul class="footer__list">
            <li><NuxtLink to="/faq">常見問題</NuxtLink></li>
            <li><NuxtLink to="/about">關於 Atelio</NuxtLink></li>
            <li><NuxtLink to="/for-organizers">開課者專區</NuxtLink></li>
            <li><NuxtLink to="/journal">知識專欄</NuxtLink></li>
          </ul>
        </nav>
      </div>
      <p class="footer__note">
        本站為求職作品，所有工作坊、講師與評價皆為虛構示範資料，請勿輸入真實個人資料。©
        {{ year }} Atelio
      </p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  background: color('bg-inverse');
  color: color('text-inverse');
  font-size: rem(14px);

  a {
    color: color('text-inverse');
    text-decoration: none;

    &:hover {
      color: color('text-inverse');
      text-decoration: underline;
    }

    &:focus-visible {
      outline-color: color('text-inverse');
    }
  }

  &__inner {
    display: flex;
    flex-direction: column;
    gap: space(6);
    padding-block: space(7) space(6);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: space(6);

    @include bp(md) {
      grid-template-columns: 1.5fr repeat(3, minmax(0, 1fr));
    }
  }

  &__brand {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: space(2);

    @include bp(md) {
      grid-column: auto;
    }
  }

  &__logo {
    font-family: var(--font-display);
    font-size: rem(24px);
    font-weight: 700;
  }

  &__heading {
    margin-bottom: space(3);
    font-family: var(--font-body);
    font-size: rem(14px);
    font-weight: 700;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: space(1);

    a {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
    }
  }

  &__note {
    padding-top: space(5);
    border-top: 1px solid rgb(253 255 245 / 0.3);
    font-size: rem(13px);
  }
}
</style>
