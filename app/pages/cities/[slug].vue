<script setup lang="ts">
/**
 * 城市落地頁（F-03），ISR。slug 不在城市清單內時回傳 HTTP 404。
 */
import { CITY_SLUGS, type CitySlug } from '#shared/types/domain'
import { catalogService } from '~/services/catalog.service'
import { CITY_NAMES } from '~/utils/labels'
import { graph, itemListNode } from '#shared/utils/structured-data'

const route = useRoute()
const slug = String(route.params.slug)
if (!CITY_SLUGS.includes(slug as CitySlug)) {
  throw createError({ statusCode: 404, statusMessage: '找不到這個城市', fatal: true })
}

const { data } = await useAsyncData(`city-${slug}`, async () => {
  const [cities, list] = await Promise.all([
    catalogService.listCities(),
    catalogService.listWorkshops({ city: slug, sort: 'rating', pageSize: 50 }),
  ])
  return { city: cities.find((c) => c.slug === slug)!, workshops: list.items }
})

usePageSeo(() => ({
  title: `${data.value?.city.name ?? ''}的手作工作坊`,
  description: data.value?.city.intro ?? '',
  path: `/cities/${slug}`,
  image: data.value?.workshops[0]?.image?.src.replace('-640', '-1280'),
}))

const { siteUrl } = useRuntimeConfig().public
useJsonLd('city', () =>
  graph([
    {
      '@type': 'CollectionPage',
      name: `${data.value?.city.name ?? ''}的手作工作坊`,
      description: data.value?.city.intro,
      mainEntity: itemListNode(
        siteUrl,
        data.value?.workshops ?? [],
        `${data.value?.city.name ?? ''}的手作工作坊`,
      ),
    },
  ]),
)

const related = CITY_SLUGS.filter((s) => s !== slug).map((s) => ({
  label: CITY_NAMES[s],
  to: `/cities/${s}`,
}))
</script>

<template>
  <WorkshopLanding
    v-if="data"
    :title="`${data.city.name}的手作工作坊`"
    :intro="data.city.intro"
    :breadcrumb-label="data.city.name"
    :workshops="data.workshops"
    :list-link="{ path: '/workshops', query: { city: slug } }"
    :related="related"
    related-title="其他城市"
  />
</template>
