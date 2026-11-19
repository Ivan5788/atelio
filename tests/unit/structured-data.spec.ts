import { describe, expect, it } from 'vitest'
import {
  breadcrumbNode,
  courseNode,
  faqNode,
  graph,
  serializeJsonLd,
  websiteNode,
} from '#shared/utils/structured-data'
import { getWorkshop } from '../../server/services/catalog.service'

const SITE = 'https://atelio.example'
const NOW = new Date('2026-11-19T02:00:00.000Z')

describe('structured data', () => {
  it('graph 包上 schema.org context', () => {
    expect(graph([{ '@type': 'Thing' }])).toEqual({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'Thing' }],
    })
  })

  it('WebSite 的 SearchAction 指向站內搜尋', () => {
    const node = websiteNode(SITE) as { potentialAction: { target: { urlTemplate: string } } }
    expect(node.potentialAction.target.urlTemplate).toBe(`${SITE}/search?q={search_term_string}`)
  })

  it('BreadcrumbList 的位置從 1 開始、網址為絕對網址', () => {
    const node = breadcrumbNode(SITE, [
      { name: '首頁', path: '/' },
      { name: '陶藝', path: '/categories/ceramics' },
    ]) as { itemListElement: { position: number; item: string }[] }
    expect(node.itemListElement.map((i) => i.position)).toEqual([1, 2])
    expect(node.itemListElement[1]!.item).toBe(`${SITE}/categories/ceramics`)
  })

  it('Course 包含價格、評分、講師與每個場次的 CourseInstance', () => {
    const workshop = getWorkshop('wheel-throwing-basics-taipei', NOW)!
    const node = courseNode(SITE, workshop) as Record<string, any>
    expect(node['@type']).toBe('Course')
    expect(node.offers).toMatchObject({ price: 1800, priceCurrency: 'TWD' })
    expect(node.aggregateRating).toMatchObject({ ratingValue: 4.8, reviewCount: 126 })
    expect(node.instructor.url).toBe(`${SITE}/instructors/chen-yihe`)
    expect(node.hasCourseInstance).toHaveLength(workshop.sessions.length)
    expect(node.timeRequired).toBe('PT180M')
    expect(node.image).toBe(`${SITE}/images/workshops/w01-1280.webp`)
    // 額滿的場次標示 SoldOut
    for (const [i, instance] of node.hasCourseInstance.entries()) {
      const expected = workshop.sessions[i]!.seatsLeft > 0 ? 'InStock' : 'SoldOut'
      expect(instance.offers.availability).toBe(`https://schema.org/${expected}`)
    }
  })

  it('FAQPage 把問答轉成 Question／Answer', () => {
    const node = faqNode([{ question: 'Q?', answer: 'A.' }]) as Record<string, any>
    expect(node.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: 'Q?',
      acceptedAnswer: { '@type': 'Answer', text: 'A.' },
    })
  })

  it('序列化時跳脫 <，內容中的 </script> 無法提前結束標籤', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('</script>')
    expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>')
  })
})
