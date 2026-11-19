/**
 * Studio（開課者後台）的業務規則。
 *
 * 每個帳號第一次進入 Studio 時，會複製一份示範開課者「土窯工作室」的工作坊到自己的資料裡，
 * 之後的新增、編輯、下架、刪除都只改自己的副本：
 * - 不影響公開頁面（公開頁面被 CDN 快取，所有人共用，不能出現個人資料）。
 * - 不影響其他訪客（A 刪掉的工作坊，B 進來時仍然存在）。
 */
import type { StudioStats, StudioWorkshop } from '#shared/types/domain'
import type { StudioListQuery, StudioWorkshopInput } from '#shared/schemas'
import {
  demoBookedSeats,
  hashString,
  sessionIdFor,
  upcomingSessionDates,
} from '#shared/utils/schedule'
import { paginate } from '#shared/utils/workshop-query'
import { toTaipeiParts } from '#shared/utils/format'
import {
  getStudioWorkshops,
  saveStudioWorkshops,
  type UserRecord,
} from '../repositories/user-data.repository'
import { workshops as seeds } from '../data/workshops'
import { notFound } from '../utils/validation'

export const DEMO_ORGANIZER = 'chen-yihe'

function seedStudio(now: Date): StudioWorkshop[] {
  return seeds
    .filter((s) => s.instructor === DEMO_ORGANIZER)
    .map((s) => {
      const sessions = upcomingSessionDates(s.schedule, now).map((startsAt) => ({
        id: sessionIdFor(s.id, startsAt),
        startsAt,
      }))
      return {
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.category,
        city: s.city,
        district: s.district,
        level: s.level,
        price: s.price,
        durationMinutes: s.durationMinutes,
        capacityPerSession: s.capacityPerSession,
        summary: s.summary,
        description: s.description,
        status: 'published',
        sessions,
        bookedCount: sessions.reduce(
          (sum, x) => sum + demoBookedSeats(x.id, s.capacityPerSession),
          0,
        ),
        updatedAt: s.updatedAt,
        origin: 'seed',
      }
    })
}

async function loadStudio(user: UserRecord, now: Date): Promise<StudioWorkshop[]> {
  const existing = await getStudioWorkshops(user)
  if (existing) return existing
  const initial = seedStudio(now)
  await saveStudioWorkshops(user, initial)
  return initial
}

export async function listStudioWorkshops(
  user: UserRecord,
  query: StudioListQuery,
  now = new Date(),
) {
  const keyword = query.q?.toLowerCase()
  const items = (await loadStudio(user, now)).filter(
    (w) =>
      (query.status === 'all' || w.status === query.status) &&
      (!keyword || w.title.toLowerCase().includes(keyword)),
  )
  const sorters: Record<StudioListQuery['sort'], (a: StudioWorkshop, b: StudioWorkshop) => number> =
    {
      updated: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      title: (a, b) => a.title.localeCompare(b.title, 'zh-Hant'),
      price: (a, b) => b.price - a.price,
      booked: (a, b) => b.bookedCount - a.bookedCount,
    }
  return paginate(items.sort(sorters[query.sort]), query.page, query.pageSize)
}

export async function getStudioWorkshop(
  user: UserRecord,
  id: string,
  now = new Date(),
): Promise<StudioWorkshop> {
  const item = (await loadStudio(user, now)).find((w) => w.id === id)
  return item ?? notFound('找不到這堂工作坊，可能已被刪除')
}

function normalizeSessions(workshopId: string, sessions: StudioWorkshopInput['sessions']) {
  return sessions
    .map((s, index) => ({
      id: s.id ?? `${workshopId}-s${Date.now().toString(36)}${index}`,
      startsAt: new Date(s.startsAt).toISOString(),
    }))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}

export async function createStudioWorkshop(
  user: UserRecord,
  input: StudioWorkshopInput,
  now = new Date(),
) {
  const items = await loadStudio(user, now)
  const id = `c${crypto.randomUUID().slice(0, 8)}`
  const created: StudioWorkshop = {
    ...input,
    id,
    slug: `custom-${id}`,
    sessions: normalizeSessions(id, input.sessions),
    bookedCount: 0,
    updatedAt: now.toISOString(),
    origin: 'custom',
  }
  await saveStudioWorkshops(user, [created, ...items])
  return created
}

export async function updateStudioWorkshop(
  user: UserRecord,
  id: string,
  input: StudioWorkshopInput,
  now = new Date(),
) {
  const items = await loadStudio(user, now)
  const current = items.find((w) => w.id === id) ?? notFound('找不到這堂工作坊，可能已被刪除')
  const updated: StudioWorkshop = {
    ...current,
    ...input,
    sessions: normalizeSessions(id, input.sessions),
    updatedAt: now.toISOString(),
  }
  await saveStudioWorkshops(
    user,
    items.map((w) => (w.id === id ? updated : w)),
  )
  return updated
}

export async function setStudioWorkshopStatus(
  user: UserRecord,
  id: string,
  status: StudioWorkshop['status'],
  now = new Date(),
) {
  const items = await loadStudio(user, now)
  const current = items.find((w) => w.id === id) ?? notFound('找不到這堂工作坊，可能已被刪除')
  const updated = { ...current, status, updatedAt: now.toISOString() }
  await saveStudioWorkshops(
    user,
    items.map((w) => (w.id === id ? updated : w)),
  )
  return updated
}

export async function deleteStudioWorkshop(user: UserRecord, id: string, now = new Date()) {
  const items = await loadStudio(user, now)
  if (!items.some((w) => w.id === id)) notFound('找不到這堂工作坊，可能已被刪除')
  await saveStudioWorkshops(
    user,
    items.filter((w) => w.id !== id),
  )
}

/**
 * 後台統計（示範數字）：以工作坊 id 與月份的雜湊值產生，同一個月份每次結果相同。
 * 只計算「已上架」的工作坊，所以下架或刪除後，圖表會跟著變化。
 */
export function computeStudioStats(items: StudioWorkshop[], now = new Date()): StudioStats {
  const published = items.filter((w) => w.status === 'published')
  const today = toTaipeiParts(now)
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(Date.UTC(today.year, today.month - 1 - (5 - i), 1))
    return {
      key: `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`,
      label: `${date.getUTCMonth() + 1} 月`,
    }
  })
  const monthly = (w: StudioWorkshop, key: string) =>
    w.origin === 'custom' ? 0 : (hashString(w.id + key) % 12) + 4

  const trend = months.map((m) => ({
    label: m.label,
    bookings: published.reduce((sum, w) => sum + monthly(w, m.key), 0),
  }))
  const current = trend.at(-1)!.bookings
  const previous = trend.at(-2)!.bookings
  const currentKey = months.at(-1)!.key

  const seedRatings = published
    .map((w) => seeds.find((s) => s.id === w.id)?.rating.average)
    .filter((r): r is number => r !== undefined)
  const capacity = published.reduce((sum, w) => sum + w.sessions.length * w.capacityPerSession, 0)
  const booked = published.reduce((sum, w) => sum + w.bookedCount, 0)

  return {
    kpis: {
      monthlyBookings: current,
      monthlyBookingsChange:
        previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100),
      monthlyRevenue: published.reduce((sum, w) => sum + monthly(w, currentKey) * w.price, 0),
      averageRating: seedRatings.length
        ? Math.round((seedRatings.reduce((a, b) => a + b, 0) / seedRatings.length) * 10) / 10
        : 0,
      fillRate: capacity === 0 ? 0 : Math.round((booked / capacity) * 100),
    },
    trend,
    workshopShare: published
      .map((w) => ({ id: w.id, title: w.title, bookings: monthly(w, currentKey) }))
      .filter((s) => s.bookings > 0),
  }
}

export async function getStudioStats(user: UserRecord, now = new Date()): Promise<StudioStats> {
  return computeStudioStats(await loadStudio(user, now), now)
}
