<script setup lang="ts">
/**
 * 常見問題（F-08），Prerender。問答以 <details> 呈現：原生可展開、鍵盤可操作，
 * 而且答案文字在 HTML 中完整存在，搜尋引擎與 AI 爬蟲都讀得到（Phase 5 加上 FAQPage 結構化資料）。
 */
useSeoMeta({
  title: '常見問題',
  description: '預約、取消、改期、付款與開課的常見問題，以及 Atelio 示範網站的資料說明。',
})

const groups = [
  {
    id: 'booking',
    title: '預約與付款',
    items: [
      {
        q: '怎麼預約工作坊？',
        a: '在工作坊頁面選擇場次與人數，按下「立即預約」，填寫聯絡資料並確認即可完成，總共三個步驟。',
      },
      {
        q: '一次可以預約幾位？',
        a: '每筆預約最多 6 位。若需要包班或更多人數，建議直接聯繫開課者。',
      },
      {
        q: '需要先付款嗎？',
        a: '本站為作品展示網站，預約只會模擬送出，不會實際收費，也不會要求填寫付款資訊。',
      },
      {
        q: '名額顯示「剩 1 位」，可以確保搶得到嗎？',
        a: '名額在送出預約的那一刻才會確認。如果在填寫期間被預約走，系統會提示名額不足並請你重新選擇場次。',
      },
    ],
  },
  {
    id: 'cancel',
    title: '取消與改期',
    items: [
      {
        q: '可以取消預約嗎？',
        a: '開課 72 小時前可以在「我的預約」免費取消。72 小時內無法線上取消，需要直接聯繫開課者。',
      },
      {
        q: '可以修改人數嗎？',
        a: '開課 72 小時前可以在「我的預約」修改人數，金額會依新人數重新計算；人數不能超過該場次的剩餘名額。',
      },
      { q: '可以改到其他場次嗎？', a: '目前需要先取消原本的預約，再重新預約新的場次。' },
    ],
  },
  {
    id: 'account',
    title: '帳號與資料',
    items: [
      {
        q: '一定要註冊才能使用嗎？',
        a: '瀏覽與搜尋不需要登入。收藏與預約需要登入，可以使用「一鍵 Demo 登入」，不需要填寫任何資料。',
      },
      {
        q: '我的資料會被保存多久？',
        a: '所有帳號（包括 Demo 帳號）與相關的預約、收藏，會在建立後 72 小時自動刪除。請勿輸入真實的個人資料或常用密碼。',
      },
      {
        q: '網站上的課程是真的嗎？',
        a: '不是。所有工作坊、講師、評價與報名數據都是虛構的示範資料，用來展示網站功能。',
      },
    ],
  },
  {
    id: 'organizer',
    title: '開課者',
    items: [
      {
        q: '我是開課者，可以上架課程嗎？',
        a: '每個帳號都能進入示範的 Studio 後台，體驗新增工作坊、管理場次與查看報名數據。這些修改只存在你的帳號中，不會出現在公開頁面。',
      },
    ],
  },
]
</script>

<template>
  <ContentPage
    title="常見問題"
    lead="預約、取消、帳號與開課的常見問題。找不到答案的話，可以先看看工作坊頁面上的課程說明。"
    breadcrumb="常見問題"
  >
    <section
      v-for="group in groups"
      :key="group.id"
      class="faq-group"
      :aria-labelledby="`faq-${group.id}`"
    >
      <h2 :id="`faq-${group.id}`">{{ group.title }}</h2>
      <div class="faq-group__list">
        <details v-for="item in group.items" :key="item.q" class="faq-group__item">
          <summary class="faq-group__question">{{ item.q }}</summary>
          <p class="faq-group__answer">{{ item.a }}</p>
        </details>
      </div>
    </section>
  </ContentPage>
</template>

<style scoped lang="scss">
.faq-group {
  display: flex;
  flex-direction: column;
  gap: space(3);

  h2 {
    @include text('h3');
  }

  &__list {
    border-top: 1px solid color('border-subtle');
  }

  &__item {
    border-bottom: 1px solid color('border-subtle');
  }

  &__question {
    display: flex;
    align-items: center;
    min-height: 56px;
    padding-block: space(3);
    font-weight: 500;
    cursor: pointer;
  }

  &__answer {
    max-width: 68ch;
    padding-bottom: space(4);
    color: color('text-muted');
  }
}
</style>
