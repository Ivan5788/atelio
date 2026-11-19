<script setup lang="ts">
/**
 * 登入頁（F-20），CSR + noindex（nuxt.config.ts routeRules）。
 * 登入成功後回到 redirect 指定的站內頁面（經過 safeRedirect 檢查）。
 */
import { Eye as IconEye, EyeOff as IconEyeOff } from 'lucide-vue-next'
import { loginSchema } from '#shared/schemas'
import { toApiError } from '~/services/http'
import { useToastStore } from '~/stores/toast'
import { safeRedirect } from '~/utils/safe-redirect'

useSeoMeta({ title: '登入', robots: 'noindex, nofollow' })

const route = useRoute()
const { login, loggedIn } = useAuth()
const toast = useToastStore()
const form = useZodForm(loginSchema, { email: '', password: '' })
const submitting = ref(false)
const formError = ref('')
const showPassword = ref(false)

// 已登入的人進到登入頁，直接導回目的地
watchEffect(() => {
  if (loggedIn.value) navigateTo(safeRedirect(route.query.redirect), { replace: true })
})

async function onSubmit() {
  formError.value = ''
  const input = form.validateAll()
  if (!input) return
  submitting.value = true
  try {
    await login(input)
    toast.success('登入成功')
    await navigateTo(safeRedirect(route.query.redirect), { replace: true })
  } catch (error) {
    const apiError = toApiError(error)
    formError.value = apiError.message
    form.setServerErrors(apiError.fieldErrors)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="登入 Atelio" subtitle="登入後可以收藏工作坊、預約課程與使用 Studio 後台。">
    <form class="auth-form" novalidate @submit.prevent="onSubmit">
      <p v-if="formError" class="auth-form__error" role="alert">{{ formError }}</p>
      <BaseInput
        v-model="form.values.email"
        v-bind="form.field('email')"
        label="Email"
        type="email"
        autocomplete="email"
        inputmode="email"
        required
      />
      <BaseInput
        v-model="form.values.password"
        v-bind="form.field('password')"
        label="密碼"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="current-password"
        required
      >
        <template #suffix>
          <button
            type="button"
            class="auth-form__toggle"
            :aria-pressed="showPassword"
            aria-label="顯示密碼"
            @click="showPassword = !showPassword"
          >
            <IconEyeOff v-if="showPassword" :size="18" aria-hidden="true" />
            <IconEye v-else :size="18" aria-hidden="true" />
          </button>
        </template>
      </BaseInput>
      <BaseButton type="submit" size="lg" variant="secondary" block :loading="submitting">
        登入
      </BaseButton>
      <p class="auth-form__switch">
        還沒有帳號？
        <NuxtLink :to="{ path: '/register', query: route.query }">註冊示範帳號</NuxtLink>
      </p>
    </form>
  </AuthCard>
</template>

<style scoped lang="scss">
.auth-form {
  display: flex;
  flex-direction: column;
  gap: space(4);

  &__error {
    padding: space(3) space(4);
    border-radius: radius('md');
    background: color('status-danger-bg');
    color: color('status-danger-fg');
    font-size: rem(14px);
  }

  &__toggle {
    position: absolute;
    right: 2px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 40px;
    border: none;
    background: transparent;
    color: color('text-muted');
    cursor: pointer;
  }

  &__switch {
    text-align: center;
    font-size: rem(14px);
    color: color('text-muted');
  }
}
</style>
