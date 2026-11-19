/**
 * 公開頁面的 SEO 設定：title、description、canonical、Open Graph、Twitter Card、robots。
 *
 * robots 由全站開關決定（runtimeConfig.public.indexable，預設 false）：
 * 本站是使用虛構資料的作品展示網站，不希望被無關的人搜尋到，所以預設輸出 noindex，
 * 但其他 SEO 設定照常輸出，展示完整的實作。正式上線時把 NUXT_PUBLIC_INDEXABLE 設為 true 即可。
 */
import type { MaybeRefOrGetter } from 'vue'
import { serializeJsonLd } from '#shared/utils/structured-data'

export interface PageSeoInput {
  title: string
  description: string
  /** canonical 路徑（不含網域）；未提供時使用目前路徑、不含 query */
  path?: string
  /** 站內圖片路徑，例如 /images/workshops/w01-1280.webp */
  image?: string
  imageAlt?: string
  type?: 'website' | 'article'
  /** 個別頁面要求不索引（例如篩選結果、搜尋頁） */
  noindex?: boolean
}

const DEFAULT_IMAGE = '/images/og-default.jpg'

export function useSiteUrl() {
  const { siteUrl } = useRuntimeConfig().public
  return (path: string) => new URL(path, siteUrl).href
}

export function usePageSeo(input: MaybeRefOrGetter<PageSeoInput>) {
  const route = useRoute()
  const { indexable } = useRuntimeConfig().public
  const absolute = useSiteUrl()
  const seo = computed(() => toValue(input))

  const canonical = computed(() => absolute(seo.value.path ?? route.path))
  const image = computed(() => absolute(seo.value.image ?? DEFAULT_IMAGE))
  const robots = computed(() => {
    // 全站不開放：連結也不要追蹤
    if (!indexable) return 'noindex, nofollow'
    // 開放時的個別頁面（篩選結果、搜尋頁）：本頁不索引，但頁內連結仍可追蹤到工作坊頁
    if (seo.value.noindex) return 'noindex, follow'
    return 'index, follow, max-image-preview:large'
  })

  useSeoMeta({
    title: () => seo.value.title,
    description: () => seo.value.description,
    robots,
    ogType: () => seo.value.type ?? 'website',
    ogTitle: () => `${seo.value.title} | Atelio`,
    ogDescription: () => seo.value.description,
    ogUrl: canonical,
    ogImage: image,
    ogImageAlt: () => seo.value.imageAlt ?? 'Atelio 手作工作坊',
    ogSiteName: 'Atelio',
    ogLocale: 'zh_TW',
    twitterCard: 'summary_large_image',
    twitterTitle: () => `${seo.value.title} | Atelio`,
    twitterDescription: () => seo.value.description,
    twitterImage: image,
  })

  useHead({ link: [{ rel: 'canonical', href: canonical }] })
}

/**
 * 輸出 JSON-LD 結構化資料。key 讓同一頁多次呼叫時不會重複，換頁時也會正確替換。
 */
export function useJsonLd(key: string, value: MaybeRefOrGetter<unknown>) {
  useHead({
    script: [
      {
        key: `ld-${key}`,
        type: 'application/ld+json',
        innerHTML: computed(() => serializeJsonLd(toValue(value))),
      },
    ],
  })
}
