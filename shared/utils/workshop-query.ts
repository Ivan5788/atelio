/**
 * 工作坊列表的篩選、排序與分頁：純函式，方便單元測試。
 * 放在 shared/ 是因為前端也會用到 normalizeKeyword（例如高亮關鍵字），
 * 但實際篩選只在伺服器執行。
 */
import type { Paginated, Workshop } from '../types/domain'
import type { WorkshopQuery } from '../schemas'
import { toTaipeiParts } from './format'

/** 全形轉半形、轉小寫、去除空白，讓「ＡＢＣ」「abc」「 abc 」都能比對到 */
export function normalizeKeyword(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/g, '')
}

function taipeiDateKey(iso: string): string {
  const p = toTaipeiParts(iso)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

export interface FilterableWorkshop extends Workshop {
  /** 額外可搜尋的文字，例如講師姓名 */
  searchText?: string
}

export function filterWorkshops<T extends FilterableWorkshop>(
  items: T[],
  query: WorkshopQuery,
): T[] {
  const keyword = query.q ? normalizeKeyword(query.q) : ''
  const categories = query.category?.length ? new Set(query.category) : null
  const levels = query.level?.length ? new Set(query.level) : null

  const filtered = items.filter((item) => {
    if (categories && !categories.has(item.category)) return false
    if (query.city && item.city !== query.city) return false
    if (levels && !levels.has(item.level)) return false
    if (query.priceMin !== undefined && item.price < query.priceMin) return false
    if (query.priceMax !== undefined && item.price > query.priceMax) return false
    if (query.dateFrom) {
      // 有任何一個「當天或之後、仍有名額」的場次才算符合
      const from = query.dateFrom
      if (!item.sessions.some((s) => s.seatsLeft > 0 && taipeiDateKey(s.startsAt) >= from))
        return false
    }
    if (keyword) {
      const haystack = normalizeKeyword(
        [
          item.title,
          item.summary,
          item.categoryName,
          item.cityName,
          item.district,
          item.searchText ?? '',
        ].join(' '),
      )
      if (!haystack.includes(keyword)) return false
    }
    return true
  })

  return sortWorkshops(filtered, query.sort)
}

export function sortWorkshops<T extends Workshop>(items: T[], sort: WorkshopQuery['sort']): T[] {
  // 沒有可報名場次的排在最後；Infinity 讓它們在 upcoming 排序中自然落到後面
  const nextTime = (w: Workshop) =>
    w.nextSession ? Date.parse(w.nextSession.startsAt) : Number.POSITIVE_INFINITY
  const sorted = [...items]
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id))
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id))
    case 'rating':
      return sorted.sort(
        (a, b) =>
          b.rating.average - a.rating.average ||
          b.rating.count - a.rating.count ||
          a.id.localeCompare(b.id),
      )
    case 'newest':
      return sorted.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
      )
    case 'upcoming':
    default:
      return sorted.sort((a, b) => nextTime(a) - nextTime(b) || a.id.localeCompare(b.id))
  }
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages }
}
