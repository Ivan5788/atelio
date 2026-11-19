<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

useSeoMeta({
  title: () => (isNotFound.value ? '找不到這個頁面' : '發生錯誤'),
  robots: 'noindex',
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout>
    <section class="container error-page">
      <p class="error-page__code">{{ error.statusCode }}</p>
      <h1>{{ isNotFound ? '找不到這個頁面' : '頁面暫時無法顯示' }}</h1>
      <!-- 不顯示技術錯誤訊息給一般使用者（docs/06 6.4 Error State） -->
      <p class="error-page__lead">
        {{
          isNotFound
            ? '網址可能輸入錯誤，或這堂工作坊已經下架。'
            : '請稍後再試一次；如果問題持續發生，可以先回到首頁。'
        }}
      </p>
      <BaseButton size="lg" @click="goHome">回到首頁</BaseButton>
    </section>
  </NuxtLayout>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: space(4);
  padding-block: space(8);

  &__code {
    @include text('mono');
    color: color('text-muted');
  }

  &__lead {
    color: color('text-muted');
  }
}
</style>
