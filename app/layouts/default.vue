<script setup lang="ts">
/**
 * 預設版面：跳到主要內容 → 作品聲明 → 導覽列 → 內容 → 頁尾。
 * Toast 與登入提示是全站共用的浮層，放在版面最後。
 */
</script>

<template>
  <div class="layout">
    <a class="skip-link" href="#main">跳到主要內容</a>
    <AppDemoBanner />
    <AppHeader />
    <main id="main" class="layout__main" tabindex="-1">
      <slot />
    </main>
    <AppFooter />
    <AppBackToTop />
    <BaseToastRegion />
    <AppLoginPrompt />
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    flex: 1;

    &:focus {
      outline: none;
    }
  }
}
</style>
