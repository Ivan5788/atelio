<script setup lang="ts">
/**
 * 會員中心的外框：左側（手機為上方）子導覽 + 內容。
 */
defineProps<{ title: string }>()

const links = [
  { to: '/account', label: '總覽', exact: true },
  { to: '/account/bookings', label: '我的預約' },
  { to: '/account/favorites', label: '收藏' },
  { to: '/account/profile', label: '個人資料' },
  { to: '/studio', label: 'Studio 後台' },
]
const route = useRoute()
const isActive = (link: (typeof links)[number]) =>
  link.exact ? route.path === link.to : route.path.startsWith(link.to)
</script>

<template>
  <div class="container shell">
    <nav class="shell__nav" aria-label="會員中心">
      <ul class="shell__list">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="shell__link"
            :class="{ 'is-active': isActive(link) }"
            :aria-current="isActive(link) ? 'page' : undefined"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
    <div class="shell__content">
      <h1 class="shell__title">{{ title }}</h1>
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.shell {
  display: grid;
  // minmax(0, 1fr)：不讓內容（例如寬表格）撐開欄寬造成整頁水平捲動
  grid-template-columns: minmax(0, 1fr);
  gap: space(5);
  padding-block: space(5) space(8);

  @include bp(lg) {
    grid-template-columns: 220px minmax(0, 1fr);
    gap: space(7);
    padding-top: space(7);
  }

  &__list {
    display: flex;
    gap: space(1);
    overflow-x: auto;
    padding-bottom: space(1);

    @include bp(lg) {
      flex-direction: column;
      position: sticky;
      top: space(4);
    }
  }

  &__link {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 0 space(4);
    border-radius: radius('full');
    color: color('text-default');
    white-space: nowrap;
    text-decoration: none;

    &:hover {
      background: color('bg-sunken');
      color: color('text-default');
    }

    &.is-active {
      background: color('bg-inverse');
      color: color('text-inverse');
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: space(5);
    min-width: 0;
  }

  &__title {
    @include text('h2');
  }
}
</style>
