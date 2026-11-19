<script setup lang="ts">
/**
 * 編輯工作坊（F-32）。資料載入完成後才渲染表單，表單的初始值與「未儲存」比對基準才會正確。
 */
import type { StudioWorkshop } from '#shared/types/domain'
import type { StudioWorkshopInput } from '#shared/schemas'
import { toApiError } from '~/services/http'
import { studioService } from '~/services/studio.service'
import { useToastStore } from '~/stores/toast'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Studio 編輯工作坊', robots: 'noindex, nofollow' })

const route = useRoute()
const id = String(route.params.id)
const toast = useToastStore()
const workshop = ref<StudioWorkshop>()
const loadError = ref('')
const formRef = ref<{
  markSaved: () => void
  setServerErrors: (e: Record<string, string>) => void
}>()
const submitting = ref(false)

async function load() {
  loadError.value = ''
  try {
    workshop.value = await studioService.get(id)
  } catch (e) {
    loadError.value = toApiError(e).message
  }
}
onMounted(load)

async function onSubmit(input: StudioWorkshopInput) {
  submitting.value = true
  try {
    const updated = await studioService.update(id, input)
    formRef.value?.markSaved()
    toast.success(`已更新「${updated.title}」`)
    await navigateTo('/studio/workshops')
  } catch (e) {
    const error = toApiError(e)
    formRef.value?.setServerErrors(error.fieldErrors)
    toast.error(error.message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <StudioShell :title="workshop ? `編輯：${workshop.title}` : '編輯工作坊'">
    <BaseEmptyState v-if="loadError" tone="error" title="無法載入工作坊" :description="loadError">
      <BaseButton variant="secondary" to="/studio/workshops">回到列表</BaseButton>
    </BaseEmptyState>
    <div v-else-if="!workshop" aria-busy="true" class="loading">
      <BaseSkeleton v-for="n in 3" :key="n" height="180px" radius="lg" />
    </div>
    <StudioWorkshopForm
      v-else
      ref="formRef"
      :initial="workshop"
      :submitting="submitting"
      @submit="onSubmit"
    />
  </StudioShell>
</template>

<style scoped lang="scss">
.loading {
  display: flex;
  flex-direction: column;
  gap: space(4);
}
</style>
