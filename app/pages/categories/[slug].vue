<script setup lang="ts">
/**
 * 分類落地頁（F-03），ISR。slug 不在分類清單內時回傳 HTTP 404。
 */
import { CATEGORY_SLUGS, type CategorySlug } from '#shared/types/domain'
import { catalogService } from '~/services/catalog.service'
import { CATEGORY_NAMES } from '~/utils/labels'

const route = useRoute()
const slug = String(route.params.slug)
if (!CATEGORY_SLUGS.includes(slug as CategorySlug)) {
  throw createError({ statusCode: 404, statusMessage: '找不到這個分類', fatal: true })
}

const { data } = await useAsyncData(`category-${slug}`, async () => {
  const [categories, list] = await Promise.all([
    catalogService.listCategories(),
    catalogService.listWorkshops({ category: slug, sort: 'rating', pageSize: 50 }),
  ])
  return { category: categories.find((c) => c.slug === slug)!, workshops: list.items }
})

useSeoMeta({
  title: () => `${data.value?.category.name ?? ''}工作坊`,
  description: () => data.value?.category.intro,
})

const related = CATEGORY_SLUGS.filter((s) => s !== slug).map((s) => ({
  label: CATEGORY_NAMES[s],
  to: `/categories/${s}`,
}))
</script>

<template>
  <WorkshopLanding
    v-if="data"
    :title="`${data.category.name}工作坊`"
    :intro="data.category.intro"
    :breadcrumb-label="data.category.name"
    :workshops="data.workshops"
    :list-link="{ path: '/workshops', query: { category: slug } }"
    :related="related"
    related-title="其他分類"
  >
    <template #badge>
      <span
        class="category-dot category-badge"
        :class="`category-dot--${slug}`"
        aria-hidden="true"
      />
    </template>
  </WorkshopLanding>
</template>

<style scoped lang="scss">
.category-badge {
  width: 40px;
  height: 40px;
}
</style>
