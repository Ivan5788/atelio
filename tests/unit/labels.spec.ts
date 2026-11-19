import { describe, expect, it } from 'vitest'
import { CATEGORY_NAMES, CITY_NAMES } from '~/utils/labels'
import { categories, cities } from '../../server/data/taxonomy'

describe('UI labels', () => {
  it('前端的分類與城市名稱與 seed 資料一致', () => {
    expect(Object.fromEntries(categories.map((c) => [c.slug, c.name]))).toEqual(CATEGORY_NAMES)
    expect(Object.fromEntries(cities.map((c) => [c.slug, c.name]))).toEqual(CITY_NAMES)
  })
})
