import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, hasActiveFilters, parseFilters, toQuery } from '~/utils/workshop-filters'

describe('workshop filters ⇄ URL query', () => {
  it('解析合法的 query', () => {
    const f = parseFilters({
      category: 'ceramics,floral',
      city: 'taipei',
      page: '2',
      sort: 'price-asc',
    })
    expect(f.category).toEqual(['ceramics', 'floral'])
    expect(f.city).toBe('taipei')
    expect(f.page).toBe(2)
    expect(f.sort).toBe('price-asc')
  })

  it('網址被改壞時只丟掉該欄位，其他條件保留', () => {
    const f = parseFilters({ category: 'hacking', city: 'taipei', page: 'abc', sort: 'drop-table' })
    expect(f.category).toEqual([])
    expect(f.city).toBe('taipei')
    expect(f.page).toBe(1)
    expect(f.sort).toBe('upcoming')
  })

  it('價格區間顛倒時兩個都忽略', () => {
    const f = parseFilters({ priceMin: '3000', priceMax: '1000' })
    expect(f.priceMin).toBeUndefined()
    expect(f.priceMax).toBeUndefined()
  })

  it('toQuery 省略預設值，並可來回轉換', () => {
    expect(toQuery(DEFAULT_FILTERS)).toEqual({})
    const f = { ...DEFAULT_FILTERS, category: ['ceramics' as const], priceMax: 2000, page: 3 }
    const query = toQuery(f)
    expect(query).toEqual({ category: 'ceramics', priceMax: '2000', page: '3' })
    expect(parseFilters(query as Record<string, string>)).toEqual(f)
  })

  it('排序與頁碼不算篩選條件', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: 'rating', page: 2 })).toBe(false)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, city: 'tainan' })).toBe(true)
  })
})
