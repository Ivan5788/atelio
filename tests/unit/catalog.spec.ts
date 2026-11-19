import { describe, expect, it } from 'vitest'
import { workshopQuerySchema } from '#shared/schemas'
import { CATEGORY_SLUGS, CITY_SLUGS } from '#shared/types/domain'
import { normalizeKeyword } from '#shared/utils/workshop-query'
import {
  allWorkshops,
  getWorkshop,
  listCategories,
  listCities,
  listWorkshops,
  relatedWorkshops,
  searchAll,
} from '../../server/services/catalog.service'
import { workshops as seeds } from '../../server/data/workshops'
import { instructors } from '../../server/data/taxonomy'
import { articles } from '../../server/data/articles'

const NOW = new Date('2026-11-19T02:00:00.000Z')
const query = (input: Record<string, unknown> = {}) => workshopQuerySchema.parse(input)

describe('seed data integrity', () => {
  it('工作坊 id 與 slug 不重複，slug 符合 URL 規範', () => {
    expect(new Set(seeds.map((w) => w.id)).size).toBe(seeds.length)
    expect(new Set(seeds.map((w) => w.slug)).size).toBe(seeds.length)
    for (const w of seeds) expect(w.slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('每個分類與城市都至少有一堂工作坊（落地頁不會是空的）', () => {
    for (const c of listCategories()) expect(c.workshopCount, c.slug).toBeGreaterThan(0)
    for (const c of listCities()) expect(c.workshopCount, c.slug).toBeGreaterThan(0)
    expect(listCategories().map((c) => c.slug)).toEqual([...CATEGORY_SLUGS])
    expect(listCities().map((c) => c.slug)).toEqual([...CITY_SLUGS])
  })

  it('每堂工作坊的講師都存在', () => {
    const slugs = new Set(instructors.map((i) => i.slug))
    for (const w of seeds) expect(slugs.has(w.instructor), w.id).toBe(true)
  })

  it('文章的相關工作坊都存在', () => {
    const slugs = new Set(seeds.map((w) => w.slug))
    for (const a of articles)
      for (const s of a.relatedWorkshopSlugs) expect(slugs.has(s), s).toBe(true)
  })

  it('每堂工作坊都有未來的場次', () => {
    for (const w of allWorkshops(NOW)) {
      expect(w.sessions.length, w.id).toBeGreaterThan(0)
      for (const s of w.sessions) expect(Date.parse(s.startsAt)).toBeGreaterThan(NOW.getTime())
    }
  })
})

describe('listWorkshops', () => {
  it('預設每頁 12 筆，回傳分頁資訊', () => {
    const result = listWorkshops(query(), NOW)
    expect(result.items).toHaveLength(12)
    expect(result.total).toBe(seeds.length)
    expect(result.totalPages).toBe(Math.ceil(seeds.length / 12))
  })

  it('依分類（多選）與城市篩選', () => {
    const result = listWorkshops(query({ category: 'ceramics,floral', city: 'taipei' }), NOW)
    expect(result.total).toBeGreaterThan(0)
    for (const w of result.items) {
      expect(['ceramics', 'floral']).toContain(w.category)
      expect(w.city).toBe('taipei')
    }
  })

  it('價格區間包含上下限', () => {
    const result = listWorkshops(query({ priceMin: 1500, priceMax: 1800, pageSize: 50 }), NOW)
    expect(result.items.map((w) => w.price).every((p) => p >= 1500 && p <= 1800)).toBe(true)
    expect(result.items.some((w) => w.price === 1500)).toBe(true)
    expect(result.items.some((w) => w.price === 1800)).toBe(true)
  })

  it('關鍵字可搜尋標題、分類名稱與講師姓名', () => {
    expect(listWorkshops(query({ q: '陶' }), NOW).total).toBeGreaterThan(0)
    const byInstructor = listWorkshops(query({ q: '陳以禾' }), NOW)
    expect(byInstructor.total).toBe(3)
  })

  it('關鍵字忽略全形與大小寫', () => {
    expect(normalizeKeyword('ＭＯＤＥＲＮ Calligraphy')).toBe('moderncalligraphy')
    expect(listWorkshops(query({ q: 'ＭＯＤＥＲＮ' }), NOW).total).toBe(1)
  })

  it('價格排序', () => {
    const asc = listWorkshops(query({ sort: 'price-asc', pageSize: 50 }), NOW).items.map(
      (w) => w.price,
    )
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
  })

  it('即將開課排序：有場次的依時間排序', () => {
    const items = listWorkshops(query({ sort: 'upcoming', pageSize: 50 }), NOW).items
    const times = items.filter((w) => w.nextSession).map((w) => Date.parse(w.nextSession!.startsAt))
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it('超出範圍的頁碼回傳空陣列而不是錯誤', () => {
    const result = listWorkshops(query({ page: 99 }), NOW)
    expect(result.items).toEqual([])
    expect(result.total).toBe(seeds.length)
  })
})

describe('workshopQuerySchema', () => {
  it('拒絕不存在的分類、超過上限的 pageSize 與顛倒的價格區間', () => {
    expect(workshopQuerySchema.safeParse({ category: 'hacking' }).success).toBe(false)
    expect(workshopQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false)
    expect(workshopQuerySchema.safeParse({ priceMin: 3000, priceMax: 1000 }).success).toBe(false)
  })

  it('query string 的數字會被轉型', () => {
    const parsed = workshopQuerySchema.parse({ page: '2', priceMax: '2000' })
    expect(parsed.page).toBe(2)
    expect(parsed.priceMax).toBe(2000)
  })
})

describe('detail and search', () => {
  it('getWorkshop 找不到時回傳 null', () => {
    expect(getWorkshop('does-not-exist', NOW)).toBeNull()
  })

  it('使用者自己的預約會扣掉剩餘名額', () => {
    const base = getWorkshop('wheel-throwing-basics-taipei', NOW)!
    const session = base.sessions.find((s) => s.seatsLeft >= 2)!
    const withBooking = getWorkshop(
      'wheel-throwing-basics-taipei',
      NOW,
      new Map([[session.id, 2]]),
    )!
    expect(withBooking.sessions.find((s) => s.id === session.id)!.seatsLeft).toBe(
      session.seatsLeft - 2,
    )
  })

  it('相關工作坊不包含自己，同分類優先', () => {
    const workshop = getWorkshop('wheel-throwing-basics-taipei', NOW)!
    const related = relatedWorkshops(workshop, NOW)
    expect(related.length).toBeGreaterThan(0)
    expect(related.some((w) => w.id === workshop.id)).toBe(false)
    expect(related[0]!.category).toBe('ceramics')
  })

  it('全站搜尋分組回傳', () => {
    const result = searchAll('陶', NOW)
    expect(result.workshops.length).toBeGreaterThan(0)
    expect(result.articles.length).toBeGreaterThan(0)
  })
})
