<script setup lang="ts">
/**
 * 開課者介紹（F-10），Prerender：說明 Studio 後台功能並引導試用。
 */
import {
  CalendarDays as IconCalendar,
  ChartLine as IconChart,
  ListChecks as IconList,
} from 'lucide-vue-next'

usePageSeo({
  title: '開課者專區',
  description: '用 Atelio Studio 上架工作坊、管理場次與名額，並查看報名趨勢與各課程表現。',
  path: '/for-organizers',
})

const features = [
  {
    icon: IconList,
    title: '上架與管理課程',
    body: '填寫課程介紹、價格與人數上限，一鍵上架或下架，草稿可以之後再編輯。',
  },
  {
    icon: IconCalendar,
    title: '彈性的場次設定',
    body: '一堂課可以設定多個場次，隨時新增或刪除，學員預約時會看到每個場次的剩餘名額。',
  },
  {
    icon: IconChart,
    title: '看得懂的報名數據',
    body: '本月報名、營收、平均評分與滿班率，加上近半年的報名趨勢，知道哪堂課最受歡迎。',
  },
]
</script>

<template>
  <ContentPage
    title="開課者專區"
    lead="不必再用表單加私訊收報名。Studio 後台讓你集中管理課程、場次與名額。"
    breadcrumb="開課者專區"
  >
    <ul class="features">
      <li v-for="feature in features" :key="feature.title" class="feature">
        <span class="feature__icon" aria-hidden="true"
          ><component :is="feature.icon" :size="24"
        /></span>
        <h2 class="feature__title">{{ feature.title }}</h2>
        <p class="feature__body">{{ feature.body }}</p>
      </li>
    </ul>
    <aside class="cta" aria-labelledby="cta-title">
      <h2 id="cta-title" class="cta__title">立即試用示範後台</h2>
      <p>
        使用一鍵 Demo
        帳號登入，就能體驗新增工作坊、管理場次與查看圖表。你的修改只存在自己的示範帳號中。
      </p>
      <BaseButton :to="{ path: '/login', query: { redirect: '/studio' } }" size="lg">
        進入 Studio
      </BaseButton>
    </aside>
  </ContentPage>
</template>

<style scoped lang="scss">
.features {
  display: grid;
  gap: space(4);

  @include bp(md) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.feature {
  display: flex;
  flex-direction: column;
  gap: space(3);
  padding: space(5);
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');

  &__icon {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: radius('md');
    background: color('bg-organizer');
  }

  &__title {
    @include text('h4');
  }

  &__body {
    color: color('text-muted');
  }
}

.cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: space(4);
  padding: space(6);
  border: 1.5px solid color('border-ink');
  border-radius: radius('lg');
  background: color('bg-organizer');
  box-shadow: shadow('sticker');

  &__title {
    @include text('h2');
  }
}
</style>
