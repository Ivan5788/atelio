<script setup lang="ts">
/**
 * Studio 後台外框：側邊導覽（手機為上方橫向）＋示範說明。
 */
import {
  LayoutDashboard as IconDashboard,
  BookOpen as IconList,
  Plus as IconPlus,
} from 'lucide-vue-next'

defineProps<{ title: string }>()

const route = useRoute()
const links = [
  { to: '/studio', label: '數據總覽', icon: IconDashboard, exact: true },
  { to: '/studio/workshops', label: '我的工作坊', icon: IconList, exact: true },
  { to: '/studio/workshops/new', label: '新增工作坊', icon: IconPlus, exact: true },
]
const isActive = (to: string) => route.path === to
</script>

<template>
  <div class="container studio">
    <nav class="studio__nav" aria-label="Studio 後台">
      <p class="studio__brand">STUDIO<span>土窯工作室（示範）</span></p>
      <ul class="studio__list">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="studio__link"
            :class="{ 'is-active': isActive(link.to) }"
            :aria-current="isActive(link.to) ? 'page' : undefined"
          >
            <component :is="link.icon" :size="18" aria-hidden="true" />
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
      <p class="studio__note">這裡的修改只存在你的示範帳號中，不會影響公開頁面與其他訪客。</p>
    </nav>
    <div class="studio__content">
      <div class="studio__head">
        <h1 class="studio__title">{{ title }}</h1>
        <slot name="actions" />
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.studio {
  display: grid;
  // minmax(0, 1fr)：不讓內容（例如寬表格）撐開欄寬造成整頁水平捲動
  grid-template-columns: minmax(0, 1fr);
  gap: space(5);
  padding-block: space(5) space(8);

  @include bp(lg) {
    grid-template-columns: 240px minmax(0, 1fr);
    gap: space(7);
    padding-top: space(6);
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: space(3);

    @include bp(lg) {
      position: sticky;
      top: space(4);
      align-self: start;
      padding: space(5);
      border-radius: radius('lg');
      background: color('bg-organizer');
    }
  }

  &__brand {
    display: flex;
    flex-direction: column;
    font-family: var(--font-mono);
    font-size: rem(13px);
    letter-spacing: 0.12em;

    span {
      font-family: var(--font-body);
      letter-spacing: 0;
      color: color('text-muted');
    }
  }

  &__list {
    display: flex;
    gap: space(1);
    overflow-x: auto;

    @include bp(lg) {
      flex-direction: column;
    }
  }

  &__link {
    display: flex;
    align-items: center;
    gap: space(2);
    min-height: 44px;
    padding: 0 space(3);
    border-radius: radius('md');
    color: color('text-default');
    white-space: nowrap;
    text-decoration: none;

    &:hover {
      background: color('bg-surface');
      color: color('text-default');
    }

    &.is-active {
      background: color('bg-inverse');
      color: color('text-inverse');
    }
  }

  &__note {
    display: none;
    font-size: rem(13px);
    color: color('text-muted');

    @include bp(lg) {
      display: block;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: space(5);
    min-width: 0;
  }

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: space(3);
  }

  &__title {
    @include text('h2');
  }
}
</style>
