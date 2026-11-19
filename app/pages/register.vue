<script setup lang="ts">
/**
 * 註冊頁（F-20）。前端驗證與後端使用同一份 registerSchema；
 * 前端驗證只是讓使用者早點知道錯在哪，後端仍會完整再驗證一次。
 */
import { registerSchema } from '#shared/schemas'
import { toApiError } from '~/services/http'
import { useToastStore } from '~/stores/toast'
import { safeRedirect } from '~/utils/safe-redirect'

useSeoMeta({ title: '註冊', robots: 'noindex, nofollow' })

const route = useRoute()
const { register } = useAuth()
const toast = useToastStore()
const form = useZodForm(registerSchema, { name: '', email: '', password: '', confirmPassword: '' })
const submitting = ref(false)
const formError = ref('')

async function onSubmit() {
  formError.value = ''
  const input = form.validateAll()
  if (!input) return
  submitting.value = true
  try {
    await register(input)
    toast.success('註冊成功，已自動登入')
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
  <AuthCard
    title="註冊示範帳號"
    subtitle="帳號與所有資料會在 72 小時後自動刪除，請勿使用真實的密碼。"
  >
    <form class="auth-form" novalidate @submit.prevent="onSubmit">
      <p v-if="formError" class="auth-form__error" role="alert">{{ formError }}</p>
      <BaseInput
        v-model="form.values.name"
        v-bind="form.field('name')"
        label="姓名"
        autocomplete="name"
        required
      />
      <BaseInput
        v-model="form.values.email"
        v-bind="form.field('email')"
        label="Email"
        type="email"
        autocomplete="email"
        inputmode="email"
        hint="可以使用不存在的 Email，例如 test@example.com"
        required
      />
      <BaseInput
        v-model="form.values.password"
        v-bind="form.field('password')"
        label="密碼"
        type="password"
        autocomplete="new-password"
        hint="至少 8 個字元，需包含英文字母與數字"
        required
      />
      <BaseInput
        v-model="form.values.confirmPassword"
        v-bind="form.field('confirmPassword')"
        label="確認密碼"
        type="password"
        autocomplete="new-password"
        required
      />
      <BaseButton type="submit" size="lg" variant="secondary" block :loading="submitting">
        建立帳號
      </BaseButton>
      <p class="auth-form__switch">
        已經有帳號？
        <NuxtLink :to="{ path: '/login', query: route.query }">登入</NuxtLink>
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

  &__switch {
    text-align: center;
    font-size: rem(14px);
    color: color('text-muted');
  }
}
</style>
