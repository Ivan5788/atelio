<script setup lang="ts">
/**
 * 作品聲明與一鍵 Demo 登入（docs/01-PRD.md 資料誠信聲明、Flow 4）。
 * 可關閉；關閉狀態只存在這個瀏覽器（localStorage），讀寫失敗時當作未關閉。
 */
import { X as IconX } from 'lucide-vue-next'
import { toApiError } from '~/services/http'
import { useToastStore } from '~/stores/toast'

const STORAGE_KEY = 'atelio:demo-banner-dismissed'
const { loggedIn, user, demoLogin } = useAuth()
const toast = useToastStore()
const dismissed = ref(false)
const loading = ref(false)

onMounted(() => {
  try {
    dismissed.value = localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    dismissed.value = false
  }
})

function dismiss() {
  dismissed.value = true
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // 無法儲存時只在這次瀏覽隱藏
  }
}

async function onDemoLogin() {
  loading.value = true
  try {
    await demoLogin()
    toast.success('已登入示範帳號，可以開始預約、收藏與使用 Studio')
  } catch (error) {
    toast.error(toApiError(error).message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <aside v-if="!dismissed" class="demo-banner" aria-label="網站說明">
    <div class="container demo-banner__inner">
      <p class="demo-banner__text">
        這是一個作品展示網站，工作坊、講師與評價皆為虛構示範資料。
        <span v-if="loggedIn && user?.isDemo"
          >你正在使用示範帳號，資料會在 72 小時後自動刪除。</span
        >
      </p>
      <button
        v-if="!loggedIn"
        type="button"
        class="demo-banner__action"
        :disabled="loading"
        :aria-busy="loading || undefined"
        @click="onDemoLogin"
      >
        {{ loading ? '登入中…' : '一鍵 Demo 登入' }}
      </button>
      <button type="button" class="demo-banner__close" aria-label="關閉網站說明" @click="dismiss">
        <IconX :size="16" aria-hidden="true" />
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.demo-banner {
  background: color('bg-inverse');
  color: color('text-inverse');
  font-size: rem(14px);

  &__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(2) space(4);
    padding-block: space(2);
  }

  &__text {
    flex: 1 1 240px;
  }

  &__action {
    min-height: 32px;
    padding: 0 space(3);
    border: 1px solid color('text-inverse');
    border-radius: radius('full');
    background: transparent;
    color: color('text-inverse');
    font-weight: 500;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: rgb(253 255 245 / 0.12);
    }

    &:focus-visible {
      outline-color: color('text-inverse');
    }
  }

  &__close {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: radius('full');
    background: transparent;
    color: color('text-inverse');
    cursor: pointer;

    &:focus-visible {
      outline-color: color('text-inverse');
    }
  }
}
</style>
