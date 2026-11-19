<script setup lang="ts">
/**
 * 登入與註冊頁共用的外框：標題、一鍵 Demo 登入、分隔線、表單插槽。
 */
import { toApiError } from '~/services/http'
import { useToastStore } from '~/stores/toast'
import { safeRedirect } from '~/utils/safe-redirect'

defineProps<{ title: string; subtitle: string }>()

const route = useRoute()
const { demoLogin } = useAuth()
const toast = useToastStore()
const loading = ref(false)

async function onDemoLogin() {
  loading.value = true
  try {
    await demoLogin()
    toast.success('已登入示範帳號')
    await navigateTo(safeRedirect(route.query.redirect), { replace: true })
  } catch (error) {
    toast.error(toApiError(error).message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container auth">
    <div class="auth__card">
      <header class="auth__header">
        <h1 class="auth__title">{{ title }}</h1>
        <p class="auth__subtitle">{{ subtitle }}</p>
      </header>

      <BaseButton size="lg" block :loading="loading" @click="onDemoLogin">
        一鍵 Demo 登入（免註冊）
      </BaseButton>
      <p class="auth__hint">面試官與訪客可直接使用，資料會在 72 小時後自動刪除。</p>

      <div class="auth__divider" role="separator"><span>或使用 Email</span></div>

      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth {
  display: flex;
  justify-content: center;
  padding-block: space(7) space(8);

  &__card {
    display: flex;
    flex-direction: column;
    gap: space(4);
    width: 100%;
    max-width: 440px;
    padding: space(6) space(5);
    border: 1.5px solid color('border-ink');
    border-radius: radius('lg');
    background: color('bg-surface');
    box-shadow: shadow('sticker');

    @include bp(md) {
      padding: space(7) space(6);
    }
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: space(2);
    margin-bottom: space(2);
  }

  &__title {
    @include text('h2');
  }

  &__subtitle,
  &__hint {
    color: color('text-muted');
    font-size: rem(14px);
  }

  &__hint {
    text-align: center;
    font-size: rem(13px);
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: space(3);
    color: color('text-muted');
    font-size: rem(13px);

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: color('border-subtle');
    }
  }
}
</style>
