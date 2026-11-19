/**
 * 列表篩選條件 ⇄ URL query 的轉換（純函式，可單元測試）。
 *
 * URL 是篩選狀態的唯一來源：重新整理、上一頁、分享連結都能還原同樣的結果。
 * 解析時逐欄驗證，網址被手動改壞（例如 ?page=abc）時只丟掉那個欄位，不會讓整頁出錯。
 */
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { workshopQuerySchema } from '#shared/schemas'
import type { CategorySlug, CitySlug, Level, SortKey } from '#shared/types/domain'

export interface WorkshopFilters {
  q: string
  category: CategorySlug[]
  city: CitySlug | ''
  level: Level[]
  priceMin?: number
  priceMax?: number
  dateFrom: string
  sort: SortKey
  page: number
}

export const DEFAULT_FILTERS: WorkshopFilters = {
  q: '',
  category: [],
  city: '',
  level: [],
  dateFrom: '',
  sort: 'upcoming',
  page: 1,
}

const first = (value: LocationQuery[string] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? undefined

type Shape = typeof workshopQuerySchema.shape

/** 用同一份 Zod schema 的單一欄位驗證，前端解析網址的規則與 API 完全一致 */
function field<K extends keyof Shape>(key: K, raw: unknown) {
  const result = workshopQuerySchema.shape[key].safeParse(raw ?? undefined)
  return result.success ? (result.data as Shape[K]['_zod']['output']) : undefined
}

export function parseFilters(query: LocationQuery): WorkshopFilters {
  const priceMin = field('priceMin', first(query.priceMin))
  const priceMax = field('priceMax', first(query.priceMax))
  const pricesValid = priceMin === undefined || priceMax === undefined || priceMin <= priceMax
  return {
    q: field('q', first(query.q)) ?? '',
    category: field('category', first(query.category)) ?? [],
    city: field('city', first(query.city)) ?? '',
    level: field('level', first(query.level)) ?? [],
    priceMin: pricesValid ? priceMin : undefined,
    priceMax: pricesValid ? priceMax : undefined,
    dateFrom: field('dateFrom', first(query.dateFrom)) ?? '',
    sort: field('sort', first(query.sort)) ?? 'upcoming',
    page: field('page', first(query.page)) ?? 1,
  }
}

/** 只輸出非預設值，網址保持簡短：/workshops?category=ceramics&city=taipei */
export function toQuery(filters: WorkshopFilters): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  if (filters.q.trim()) query.q = filters.q.trim()
  if (filters.category.length) query.category = filters.category.join(',')
  if (filters.city) query.city = filters.city
  if (filters.level.length) query.level = filters.level.join(',')
  if (filters.priceMin !== undefined) query.priceMin = String(filters.priceMin)
  if (filters.priceMax !== undefined) query.priceMax = String(filters.priceMax)
  if (filters.dateFrom) query.dateFrom = filters.dateFrom
  if (filters.sort !== DEFAULT_FILTERS.sort) query.sort = filters.sort
  if (filters.page > 1) query.page = String(filters.page)
  return query
}

/** 是否有任何篩選條件（不含排序與頁碼）——有的話頁面設為 noindex */
export function hasActiveFilters(filters: WorkshopFilters): boolean {
  return Boolean(
    filters.q ||
    filters.category.length ||
    filters.city ||
    filters.level.length ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.dateFrom,
  )
}
