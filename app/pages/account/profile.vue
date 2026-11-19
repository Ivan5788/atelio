<script setup lang="ts">
/**
 * 個人資料（F-24）：姓名、電話、興趣分類。
 * 離開頁面前若有未儲存的變更，提示使用者確認。
 */
import { CATEGORY_SLUGS, type CategorySlug } from '#shared/types/domain'
import { profileSchema } from '#shared/schemas'
import { accountService } from '~/services/account.service'
import { toApiError } from '~/services/http'
import { useToastStore } from '~/stores/toast'
import { CATEGORY_NAMES } from '~/utils/labels'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: '個人資料', robots: 'noindex, nofollow' })

const toast = useToastStore()
const { refresh } = useAuth()
const form = useZodForm(profileSchema, { name: '', phone: '', interests: [] as CategorySlug[] })
const email = ref('')
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saved = ref('')

const snapshot = () => JSON.stringify({ ...form.values })
const savedState = ref('')
const dirty = computed(() => !loading.value && snapshot() !== savedState.value)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const me = await accountService.me()
    email.value = me.email
    Object.assign(form.values, {
      name: me.name,
      phone: me.phone ?? '',
      interests: me.interests ?? [],
    })
    savedState.value = snapshot()
  } catch (e) {
    loadError.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}
onMounted(load)

function toggleInterest(slug: CategorySlug) {
  const list = form.values.interests ?? []
  form.values.interests = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]
}

async function onSubmit() {
  saved.value = ''
  const input = form.validateAll()
  if (!input) return
  saving.value = true
  try {
    await accountService.updateProfile(input)
    await refresh()
    savedState.value = snapshot()
    saved.value = '已儲存'
    toast.success('個人資料已更新')
  } catch (e) {
    const apiError = toApiError(e)
    form.setServerErrors(apiError.fieldErrors)
    toast.error(apiError.message)
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('有尚未儲存的變更，確定要離開嗎？')) return false
})
</script>

<template>
  <AccountShell title="個人資料">
    <BaseEmptyState v-if="loadError" tone="error" title="無法載入個人資料" :description="loadError">
      <BaseButton variant="secondary" @click="load">重新載入</BaseButton>
    </BaseEmptyState>

    <div v-else-if="loading" class="form" aria-busy="true">
      <BaseSkeleton v-for="n in 3" :key="n" height="72px" radius="md" />
    </div>

    <form v-else class="form" novalidate @submit.prevent="onSubmit">
      <BaseInput :model-value="email" label="Email" type="email" disabled hint="Email 無法修改" />
      <BaseInput
        v-model="form.values.name"
        v-bind="form.field('name')"
        label="姓名"
        autocomplete="name"
        required
      />
      <BaseInput
        v-model="form.values.phone"
        v-bind="form.field('phone')"
        label="手機號碼（選填）"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        hint="09 開頭共 10 碼，預約時會自動帶入"
      />
      <fieldset class="interests">
        <legend class="interests__legend">有興趣的分類</legend>
        <div class="interests__list">
          <label v-for="slug in CATEGORY_SLUGS" :key="slug" class="interests__option">
            <input
              type="checkbox"
              :checked="form.values.interests?.includes(slug)"
              @change="toggleInterest(slug)"
            />
            <span class="category-dot" :class="`category-dot--${slug}`" aria-hidden="true" />
            {{ CATEGORY_NAMES[slug] }}
          </label>
        </div>
      </fieldset>
      <div class="form__actions">
        <BaseButton type="submit" :loading="saving" :disabled="!dirty">儲存變更</BaseButton>
        <span class="form__status" role="status">{{ saved }}</span>
      </div>
    </form>
  </AccountShell>
</template>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
  gap: space(5);
  max-width: 520px;

  &__actions {
    display: flex;
    align-items: center;
    gap: space(4);
  }

  &__status {
    color: color('status-success-fg');
    font-size: rem(14px);
  }
}

.interests {
  margin: 0;
  padding: 0;
  border: none;

  &__legend {
    margin-bottom: space(3);
    font-size: rem(14px);
    font-weight: 700;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: space(2);
  }

  &__option {
    display: flex;
    align-items: center;
    gap: space(2);
    min-height: 44px;
    padding: 0 space(3);
    border: 1px solid color('border-subtle');
    border-radius: radius('md');
    background: color('bg-surface');
    cursor: pointer;

    &:has(input:checked) {
      border-color: color('action-accent-fg');
      background: color('bg-selected');
    }

    input {
      width: 18px;
      height: 18px;
      accent-color: var(--palette-blush-800);
    }
  }
}
</style>
