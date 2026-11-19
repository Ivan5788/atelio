<script setup lang="ts">
/**
 * 關於 Atelio（F-09），Prerender：產品理念、作品聲明（示範資料）、技術說明。
 */
useSeoMeta({
  title: '關於 Atelio',
  description:
    'Atelio 是一個求職作品：探索、比較並預約設計與手作工作坊的平台。網站上的課程與講師皆為虛構示範資料。',
})

const stack = [
  {
    name: 'Nuxt 4（Vue 3、TypeScript）',
    why: '依頁面類型混合渲染：公開內容預先產生或 ISR 快取，會員與後台頁面只在瀏覽器渲染。',
  },
  {
    name: 'Nitro Server API + Zod',
    why: '真正會驗證輸入、檢查權限與寫入資料庫的 REST API，前後端共用同一份驗證規則。',
  },
  { name: 'Upstash Redis', why: '儲存帳號、預約與收藏；每個帳號的資料 72 小時後自動過期。' },
  {
    name: 'SCSS + CSS 變數設計 Token',
    why: '色彩、字級、間距只定義一次；單元測試會檢查所有允許的文字與底色組合都達到 WCAG AA 對比。',
  },
  {
    name: 'Vitest + Playwright',
    why: '單元測試涵蓋業務規則與驗證，E2E 測試涵蓋「搜尋到取消預約」與後台流程。',
  },
]
</script>

<template>
  <ContentPage
    title="關於 Atelio"
    lead="Atelio 讓人探索、比較並預約設計與手作工作坊，同時提供開課者管理課程與查看報名數據的後台。"
    breadcrumb="關於 Atelio"
  >
    <section class="about-section" aria-labelledby="about-why">
      <h2 id="about-why">為什麼做這個網站</h2>
      <p>
        體驗型課程的資訊常常散落在社群貼文與各工作室的網站之間，想比較時間、價格、地點與剩餘名額並不容易。Atelio
        把這些資訊整理在同一個地方，並讓預約、取消與管理都能在線上完成。
      </p>
    </section>

    <section class="about-section about-section--notice" aria-labelledby="about-notice">
      <h2 id="about-notice">作品聲明</h2>
      <p>
        這是一個求職用的作品集網站。網站上所有工作坊、講師、評價與報名數據都是<strong>虛構的示範資料</strong>，預約不會實際收費。帳號與資料會在建立後
        72 小時自動刪除，請勿輸入真實的個人資料。
      </p>
    </section>

    <section class="about-section" aria-labelledby="about-stack">
      <h2 id="about-stack">技術與設計</h2>
      <dl class="stack">
        <div v-for="item in stack" :key="item.name" class="stack__item">
          <dt>{{ item.name }}</dt>
          <dd>{{ item.why }}</dd>
        </div>
      </dl>
      <p>
        色彩、字級與元件規範可以在<NuxtLink to="/dev/styleguide">設計規範頁</NuxtLink
        >查看，所有對比數值都由程式即時計算。
      </p>
    </section>
  </ContentPage>
</template>

<style scoped lang="scss">
.about-section {
  display: flex;
  flex-direction: column;
  gap: space(3);
  max-width: 68ch;
  @include text('body-lg');

  h2 {
    @include text('h3');
  }

  &--notice {
    padding: space(5);
    border: 1.5px dashed color('border-dashed');
    border-radius: radius('lg');
    background: color('bg-ticket');
  }
}

.stack {
  display: flex;
  flex-direction: column;
  gap: space(3);

  &__item {
    padding: space(4);
    border: 1px solid color('border-subtle');
    border-radius: radius('md');
    background: color('bg-surface');
  }

  dt {
    font-weight: 700;
  }

  dd {
    color: color('text-muted');
    font-size: rem(15px);
  }
}
</style>
