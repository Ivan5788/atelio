<script setup lang="ts">
// Phase 3 只放版面骨架；Header、Footer、Demo 提示列於 Phase 4 實作。
</script>

<template>
  <div class="layout">
    <a class="skip-link" href="#main">跳到主要內容</a>
    <main id="main" class="layout__main" tabindex="-1">
      <slot />
    </main>
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
