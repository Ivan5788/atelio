<script setup lang="ts">
// 暫時的首頁：Phase 4 依設計稿實作。
useSeoMeta({
  title: '探索並預約設計與手作工作坊',
  description: '比較全台陶藝、皮革、花藝、版畫工作坊的時間、價格與剩餘名額，線上直接預約。',
})
</script>

<template>
  <section class="container home">
    <p class="home__overline">CRAFT WORKSHOPS · TAIWAN</p>
    <h1>找一個週末，<br />親手做點什麼</h1>
    <p class="home__lead">網站建置中。目前可以先看設計規範頁，確認色彩、字級與元件。</p>
    <BaseButton to="/dev/styleguide" size="lg">查看設計規範</BaseButton>
  </section>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: space(5);
  padding-block: space(8);

  &__overline {
    @include text('mono');
    font-size: rem(12px);
    letter-spacing: 0.12em;
    color: color('text-muted');
  }

  h1 {
    @include text('display');
  }

  &__lead {
    @include text('body-lg');
    max-width: 34em;
    color: color('text-muted');
  }
}
</style>
