<script setup lang="ts">
/**
 * 全站導覽列（docs/02-sitemap.md §4）。
 * - 分類選單與手機選單都是 disclosure 模式：按鈕 + aria-expanded + aria-controls。
 * - Esc、點擊外部、換頁時自動關閉。
 * - 登入狀態只在瀏覽器讀取（nuxt.config auth.loadStrategy），讀取完成前顯示同尺寸佔位，避免版面跳動。
 */
import {
  ChevronDown as IconChevron,
  Heart as IconHeart,
  Menu as IconMenu,
  Search as IconSearch,
  X as IconX,
} from 'lucide-vue-next'
import { CATEGORY_SLUGS } from '#shared/types/domain'
import { CATEGORY_NAMES } from '~/utils/labels'

const route = useRoute()
const { ready, loggedIn, user, logout } = useAuth()

const categoryOpen = ref(false)
const menuOpen = ref(false)
const userMenuOpen = ref(false)
const searchQuery = ref('')
const headerRef = ref<HTMLElement>()

const categoryMenuId = useId()
const mobileMenuId = useId()
const userMenuId = useId()

const navItems = [
  { to: '/workshops', label: '探索工作坊' },
  { to: '/instructors', label: '講師' },
  { to: '/journal', label: '知識專欄' },
  { to: '/for-organizers', label: '開課者專區' },
]

function closeAll() {
  categoryOpen.value = false
  menuOpen.value = false
  userMenuOpen.value = false
}

watch(() => route.fullPath, closeAll)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeAll()
}

function onClickOutside(event: MouseEvent) {
  if (headerRef.value && !headerRef.value.contains(event.target as Node)) {
    categoryOpen.value = false
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onClickOutside)
})

function onSearch() {
  const q = searchQuery.value.trim()
  if (q) navigateTo({ path: '/search', query: { q } })
}
</script>

<template>
  <header ref="headerRef" class="header">
    <div class="container header__inner">
      <NuxtLink to="/" class="header__logo" aria-label="Atelio 首頁">Atelio</NuxtLink>

      <nav class="header__nav" aria-label="主要導覽">
        <ul class="header__nav-list">
          <li>
            <NuxtLink to="/workshops" class="header__link">探索工作坊</NuxtLink>
          </li>
          <li class="header__dropdown">
            <button
              type="button"
              class="header__link header__link--button"
              :aria-expanded="categoryOpen"
              :aria-controls="categoryMenuId"
              @click.stop="categoryOpen = !categoryOpen"
            >
              分類
              <IconChevron :size="16" aria-hidden="true" class="header__chevron" />
            </button>
            <ul v-show="categoryOpen" :id="categoryMenuId" class="header__menu">
              <li v-for="slug in CATEGORY_SLUGS" :key="slug">
                <NuxtLink :to="`/categories/${slug}`" class="header__menu-link">
                  <span class="category-dot" :class="`category-dot--${slug}`" aria-hidden="true" />
                  {{ CATEGORY_NAMES[slug] }}
                </NuxtLink>
              </li>
            </ul>
          </li>
          <li v-for="item in navItems.slice(1)" :key="item.to">
            <NuxtLink :to="item.to" class="header__link">{{ item.label }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="header__actions">
        <form class="header__search" role="search" @submit.prevent="onSearch">
          <label for="header-search" class="visually-hidden">搜尋工作坊、講師、文章</label>
          <input
            id="header-search"
            v-model="searchQuery"
            type="search"
            name="q"
            placeholder="搜尋工作坊、講師"
            class="header__search-input"
            maxlength="50"
          />
          <button type="submit" class="header__icon-button header__search-submit" aria-label="搜尋">
            <IconSearch :size="18" aria-hidden="true" />
          </button>
        </form>

        <NuxtLink to="/search" class="header__icon-button header__search-mobile" aria-label="搜尋">
          <IconSearch :size="20" aria-hidden="true" />
        </NuxtLink>

        <NuxtLink to="/account/favorites" class="header__icon-button" aria-label="我的收藏">
          <IconHeart :size="20" aria-hidden="true" />
        </NuxtLink>

        <span v-if="!ready" class="header__auth-placeholder" aria-hidden="true" />
        <NuxtLink v-else-if="!loggedIn" to="/login" class="header__login">登入</NuxtLink>
        <div v-else class="header__dropdown header__user">
          <button
            type="button"
            class="header__login"
            :aria-expanded="userMenuOpen"
            :aria-controls="userMenuId"
            @click.stop="userMenuOpen = !userMenuOpen"
          >
            <span class="header__user-name">{{ user?.name }}</span>
            <IconChevron :size="16" aria-hidden="true" class="header__chevron" />
          </button>
          <ul v-show="userMenuOpen" :id="userMenuId" class="header__menu header__menu--right">
            <li><NuxtLink to="/account" class="header__menu-link">會員中心</NuxtLink></li>
            <li><NuxtLink to="/account/bookings" class="header__menu-link">我的預約</NuxtLink></li>
            <li><NuxtLink to="/studio" class="header__menu-link">Studio 後台</NuxtLink></li>
            <li>
              <button type="button" class="header__menu-link header__menu-button" @click="logout">
                登出
              </button>
            </li>
          </ul>
        </div>

        <button
          type="button"
          class="header__icon-button header__menu-toggle"
          :aria-expanded="menuOpen"
          :aria-controls="mobileMenuId"
          :aria-label="menuOpen ? '關閉選單' : '開啟選單'"
          @click="menuOpen = !menuOpen"
        >
          <IconX v-if="menuOpen" :size="22" aria-hidden="true" />
          <IconMenu v-else :size="22" aria-hidden="true" />
        </button>
      </div>
    </div>

    <nav
      v-show="menuOpen"
      :id="mobileMenuId"
      class="header__mobile"
      aria-label="主要導覽（行動版）"
    >
      <div class="container">
        <ul class="header__mobile-list">
          <li v-for="item in navItems" :key="item.to">
            <NuxtLink :to="item.to" class="header__mobile-link">{{ item.label }}</NuxtLink>
          </li>
        </ul>
        <p class="header__mobile-heading">分類</p>
        <ul class="header__mobile-grid">
          <li v-for="slug in CATEGORY_SLUGS" :key="slug">
            <NuxtLink :to="`/categories/${slug}`" class="header__mobile-chip">
              <span class="category-dot" :class="`category-dot--${slug}`" aria-hidden="true" />
              {{ CATEGORY_NAMES[slug] }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<style scoped lang="scss">
.header {
  position: relative;
  z-index: z('header');
  border-bottom: 1px solid color('border-subtle');
  background: color('bg-page');

  &__inner {
    display: flex;
    align-items: center;
    gap: space(6);
    min-height: 64px;

    @include bp(lg) {
      min-height: 72px;
    }
  }

  &__logo {
    font-family: var(--font-display);
    font-size: rem(24px);
    font-weight: 700;
    color: color('text-default');
    text-decoration: none;

    &:hover {
      color: color('text-default');
    }
  }

  &__nav {
    display: none;

    @include bp(lg) {
      display: block;
    }
  }

  &__nav-list {
    display: flex;
    align-items: center;
    gap: space(1);
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: space(1);
    min-height: 44px;
    padding: 0 space(3);
    border-radius: radius('full');
    color: color('text-default');
    font-size: rem(15px);
    text-decoration: none;

    &:hover {
      background: color('bg-sunken');
      color: color('text-default');
    }

    &.router-link-active {
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 0.4em;
      text-decoration-color: color('action-accent-fg');
    }

    &--button {
      border: none;
      background: transparent;
      cursor: pointer;
    }
  }

  &__chevron {
    @include motion-safe {
      transition: transform duration('fast');
    }

    [aria-expanded='true'] > & {
      transform: rotate(180deg);
    }
  }

  &__dropdown {
    position: relative;
  }

  &__menu {
    position: absolute;
    top: calc(100% + #{space(2)});
    left: 0;
    z-index: z('dropdown');
    min-width: 200px;
    padding: space(2);
    border: 1.5px solid color('border-ink');
    border-radius: radius('md');
    background: color('bg-surface');
    box-shadow: shadow('md');

    &--right {
      left: auto;
      right: 0;
    }
  }

  &__menu-link {
    display: flex;
    align-items: center;
    gap: space(3);
    width: 100%;
    min-height: 44px;
    padding: 0 space(3);
    border-radius: radius('sm');
    color: color('text-default');
    text-decoration: none;
    font-size: rem(15px);

    &:hover {
      background: color('bg-selected');
      color: color('text-default');
    }
  }

  &__menu-button {
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: space(1);
    margin-left: auto;
  }

  &__search {
    display: none;
    position: relative;

    @include bp(lg) {
      display: flex;
    }
  }

  &__search-input {
    width: 200px;
    height: 40px;
    padding: 0 space(7) 0 space(3);
    border: 1px solid color('border-strong');
    border-radius: radius('full');
    background: color('bg-surface');
    font-size: rem(15px);

    @include bp(xl) {
      width: 240px;
    }
  }

  &__search-submit {
    position: absolute;
    right: 2px;
    top: 50%;
    width: 36px;
    height: 36px;
    transform: translateY(-50%);
  }

  &__search-mobile {
    @include bp(lg) {
      display: none;
    }
  }

  &__icon-button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: radius('full');
    background: transparent;
    color: color('text-default');
    cursor: pointer;

    &:hover {
      background: color('bg-sunken');
      color: color('text-default');
    }
  }

  &__login {
    display: inline-flex;
    align-items: center;
    gap: space(1);
    min-height: 40px;
    padding: 0 space(4);
    border: 1px solid color('border-strong');
    border-radius: radius('full');
    background: color('bg-surface');
    color: color('text-default');
    font-size: rem(15px);
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      border-color: color('border-ink');
      color: color('text-default');
    }
  }

  &__user-name {
    max-width: 8em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__auth-placeholder {
    width: 72px;
    height: 40px;
  }

  &__menu-toggle {
    @include bp(lg) {
      display: none;
    }
  }

  &__mobile {
    border-top: 1px solid color('border-subtle');
    padding-block: space(4) space(5);

    @include bp(lg) {
      display: none !important;
    }
  }

  &__mobile-list {
    display: flex;
    flex-direction: column;
  }

  &__mobile-link {
    display: flex;
    align-items: center;
    min-height: 48px;
    border-bottom: 1px solid color('border-subtle');
    color: color('text-default');
    font-size: rem(17px);
    text-decoration: none;
  }

  &__mobile-heading {
    margin-top: space(5);
    margin-bottom: space(3);
    font-size: rem(14px);
    font-weight: 700;
    color: color('text-muted');
  }

  &__mobile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: space(2);
  }

  &__mobile-chip {
    display: flex;
    align-items: center;
    gap: space(2);
    min-height: 44px;
    padding: 0 space(3);
    border: 1px solid color('border-subtle');
    border-radius: radius('md');
    background: color('bg-surface');
    color: color('text-default');
    text-decoration: none;
  }
}
</style>
