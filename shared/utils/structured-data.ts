/**
 * Schema.org 結構化資料（JSON-LD）的產生器：純函式，方便單元測試。
 *
 * 用途：讓搜尋引擎與 AI 搜尋「理解」頁面內容（這是什麼、在哪裡、多少錢、誰教的），
 * 不保證出現複合式搜尋結果。
 *
 * ⚠️ 本站資料為虛構，所以整站預設 noindex（nuxt.config.ts 的 NUXT_PUBLIC_INDEXABLE）。
 * 把虛構的課程以結構化資料送進搜尋引擎屬於誤導內容，結構化資料在這裡是技術展示，
 * 正式產品換成真實資料後再開放索引。
 */
import type {
  Article,
  ArticleSummary,
  FaqItem,
  Instructor,
  Workshop,
  WorkshopSummary,
} from '../types/domain'

type Json = Record<string, unknown>

export const SITE_NAME = 'Atelio'
export const SITE_DESCRIPTION =
  '探索、比較並預約設計與手作工作坊的平台（作品展示網站，資料為虛構）。'

const abs = (siteUrl: string, path: string) => new URL(path, siteUrl).href

/** 組成最外層的 @context；多個節點放在 @graph，同一頁只輸出一個 script */
export function graph(nodes: Json[]): Json {
  return { '@context': 'https://schema.org', '@graph': nodes }
}

export function organizationNode(siteUrl: string): Json {
  return {
    '@type': 'Organization',
    '@id': abs(siteUrl, '/#organization'),
    name: SITE_NAME,
    url: abs(siteUrl, '/'),
    logo: abs(siteUrl, '/favicon.ico'),
    description: SITE_DESCRIPTION,
  }
}

/** 首頁：WebSite + SearchAction（告訴搜尋引擎站內搜尋的網址格式） */
export function websiteNode(siteUrl: string): Json {
  return {
    '@type': 'WebSite',
    '@id': abs(siteUrl, '/#website'),
    name: SITE_NAME,
    url: abs(siteUrl, '/'),
    inLanguage: 'zh-Hant-TW',
    publisher: { '@id': abs(siteUrl, '/#organization') },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${abs(siteUrl, '/search')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbNode(siteUrl: string, items: { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: abs(siteUrl, item.path),
    })),
  }
}

/** 列表、分類頁、城市頁：ItemList，項目指向各工作坊的網址 */
export function itemListNode(siteUrl: string, workshops: WorkshopSummary[], name: string): Json {
  return {
    '@type': 'ItemList',
    name,
    numberOfItems: workshops.length,
    itemListElement: workshops.map((w, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: abs(siteUrl, `/workshops/${w.slug}`),
      name: w.title,
    })),
  }
}

/**
 * 工作坊詳細頁：Course + CourseInstance（每個場次）。
 * - 價格放在 Offer（TWD），名額為 0 的場次標示 SoldOut。
 * - 地點只到行政區（示範資料沒有真實地址）。
 */
export function courseNode(siteUrl: string, workshop: Workshop): Json {
  const url = abs(siteUrl, `/workshops/${workshop.slug}`)
  return {
    '@type': 'Course',
    '@id': `${url}#course`,
    name: workshop.title,
    description: workshop.summary,
    url,
    inLanguage: 'zh-Hant-TW',
    image: workshop.image ? abs(siteUrl, workshop.image.src.replace('-640', '-1280')) : undefined,
    educationalLevel: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[
      workshop.level
    ],
    timeRequired: `PT${workshop.durationMinutes}M`,
    teaches: workshop.learn,
    provider: { '@id': abs(siteUrl, '/#organization') },
    instructor: {
      '@type': 'Person',
      name: workshop.instructor.name,
      url: abs(siteUrl, `/instructors/${workshop.instructor.slug}`),
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: workshop.rating.average,
      reviewCount: workshop.rating.count,
      bestRating: 5,
    },
    review: workshop.reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.date.slice(0, 10),
      reviewBody: r.body,
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
    })),
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      price: workshop.price,
      priceCurrency: 'TWD',
      url,
    },
    hasCourseInstance: workshop.sessions.map((s) => ({
      '@type': 'CourseInstance',
      courseMode: 'Onsite',
      startDate: s.startsAt,
      endDate: new Date(Date.parse(s.startsAt) + workshop.durationMinutes * 60_000).toISOString(),
      location: {
        '@type': 'Place',
        name: workshop.instructor.studio,
        address: {
          '@type': 'PostalAddress',
          addressLocality: workshop.district,
          addressRegion: workshop.cityName,
          addressCountry: 'TW',
        },
      },
      instructor: { '@type': 'Person', name: workshop.instructor.name },
      offers: {
        '@type': 'Offer',
        price: workshop.price,
        priceCurrency: 'TWD',
        availability: s.seatsLeft > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        url,
      },
    })),
  }
}

export function faqNode(items: FaqItem[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

/** 講師頁：ProfilePage + Person */
export function profileNode(siteUrl: string, instructor: Instructor): Json {
  const url = abs(siteUrl, `/instructors/${instructor.slug}`)
  return {
    '@type': 'ProfilePage',
    url,
    mainEntity: {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: instructor.name,
      jobTitle: instructor.title,
      description: instructor.bio,
      worksFor: { '@type': 'Organization', name: instructor.studio },
      url,
    },
  }
}

export function articleNode(siteUrl: string, article: Article): Json {
  const url = abs(siteUrl, `/journal/${article.slug}`)
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.excerpt,
    url,
    inLanguage: 'zh-Hant-TW',
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Organization', name: article.author },
    publisher: { '@id': abs(siteUrl, '/#organization') },
    mainEntityOfPage: url,
  }
}

export function blogNode(siteUrl: string, articles: ArticleSummary[]): Json {
  return {
    '@type': 'Blog',
    name: `${SITE_NAME} 知識專欄`,
    url: abs(siteUrl, '/journal'),
    blogPost: articles.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: abs(siteUrl, `/journal/${a.slug}`),
      datePublished: a.publishedAt,
      dateModified: a.updatedAt,
    })),
  }
}

/**
 * 把 JSON-LD 安全地放進 <script>：把 < 轉成 <，
 * 避免內容裡出現 "</script>" 時提前結束標籤（XSS 風險）。
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
