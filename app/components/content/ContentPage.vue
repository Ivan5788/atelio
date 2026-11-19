<script setup lang="ts">
/**
 * 靜態內容頁（FAQ、關於、開課者介紹）共用版型。
 */
defineProps<{ title: string; lead: string; breadcrumb: string }>()
</script>

<template>
  <div class="container content-page">
    <AppBreadcrumb :items="[{ label: breadcrumb }]" />
    <header class="content-page__header">
      <h1>{{ title }}</h1>
      <p class="content-page__lead">{{ lead }}</p>
    </header>
    <div class="content-page__body">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.content-page {
  display: flex;
  flex-direction: column;
  gap: space(6);
  max-width: 880px;
  padding-block: space(5) space(8);

  &__header {
    display: flex;
    flex-direction: column;
    gap: space(3);
  }

  &__lead {
    @include text('body-lg');
    color: color('text-muted');
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: space(7);
  }
}
</style>
