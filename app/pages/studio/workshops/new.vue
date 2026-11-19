<script setup lang="ts">
/**
 * 新增工作坊（F-32）。
 */
import type { StudioWorkshopInput } from '#shared/schemas'
import { toApiError } from '~/services/http'
import { studioService } from '~/services/studio.service'
import { useToastStore } from '~/stores/toast'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Studio 新增工作坊', robots: 'noindex, nofollow' })

const toast = useToastStore()
const formRef = ref<{
  markSaved: () => void
  setServerErrors: (e: Record<string, string>) => void
}>()
const submitting = ref(false)

async function onSubmit(input: StudioWorkshopInput) {
  submitting.value = true
  try {
    const created = await studioService.create(input)
    formRef.value?.markSaved()
    toast.success(
      created.status === 'published'
        ? `已上架「${created.title}」`
        : `已儲存草稿「${created.title}」`,
    )
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
  <StudioShell title="新增工作坊">
    <StudioWorkshopForm ref="formRef" :submitting="submitting" @submit="onSubmit" />
  </StudioShell>
</template>
