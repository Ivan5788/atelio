<script setup lang="ts">
/**
 * 需要登入的操作（例如收藏）被觸發時顯示（docs/03-user-flow.md Flow 1）。
 * 提供一鍵 Demo 登入，面試官不用註冊也能繼續操作；登入後留在原本的頁面。
 */
import { toApiError } from '~/services/http'
import { useToastStore } from '~/stores/toast'

const { loginPromptOpen, demoLogin } = useAuth()
const route = useRoute()
const toast = useToastStore()
const loading = ref(false)

async function onDemoLogin() {
  loading.value = true
  try {
    await demoLogin()
    loginPromptOpen.value = false
    toast.success('已登入示範帳號，可以再按一次收藏')
  } catch (error) {
    toast.error(toApiError(error).message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal
    v-model:open="loginPromptOpen"
    title="登入後即可收藏"
    description="收藏與預約需要登入。不想註冊的話，可以使用一鍵 Demo 帳號，資料會在 72 小時後自動刪除。"
    :persistent="loading"
  >
    <div class="login-prompt">
      <BaseButton block size="lg" :loading="loading" @click="onDemoLogin"
        >一鍵 Demo 登入</BaseButton
      >
      <BaseButton
        block
        variant="secondary"
        :to="{ path: '/login', query: { redirect: route.fullPath } }"
        @click="loginPromptOpen = false"
      >
        使用 Email 登入或註冊
      </BaseButton>
    </div>
  </BaseModal>
</template>

<style scoped lang="scss">
.login-prompt {
  display: flex;
  flex-direction: column;
  gap: space(3);
}
</style>
