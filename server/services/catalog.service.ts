/**
 * 公開內容（seed 資料）的組裝與查詢。
 * 這一層只讀 seed、不碰 Redis，是純函式，可以直接單元測試。
 *
 * userBookedSeats：目前使用者在各場次已預約的人數。
 * 公開 API（會被 ISR 快取）一律不傳，只有需要登入的 API 才傳，
 * 避免把某位使用者的資料快取給所有人（docs/04-architecture.md §3）。
 */
import type {
  Article,
  ArticleSummary,
  Category,
  City,
  Instructor,
  Review,
  Workshop,
  WorkshopSession,
  WorkshopSummary,
} from '#shared/types/domain'
import type { WorkshopQuery } from '#shared/schemas'
import {
  demoBookedSeats,
  hashString,
  sessionIdFor,
  upcomingSessionDates,
} from '#shared/utils/schedule'
import {
  filterWorkshops,
  normalizeKeyword,
  paginate,
  type FilterableWorkshop,
} from '#shared/utils/workshop-query'
import { categories, cities, instructors } from '../data/taxonomy'
import {
  commonFaq,
  reviewAuthors,
  reviewPool,
  workshops,
  type WorkshopSeed,
} from '../data/workshops'
import { articles } from '../data/articles'
import { workshopImageFor } from '#shared/data/workshop-images'

export type UserBookedSeats = ReadonlyMap<string, number>
const EMPTY: UserBookedSeats = new Map()

const categoryName = new Map(categories.map((c) => [c.slug, c.name]))
const cityName = new Map(cities.map((c) => [c.slug, c.name]))
const instructorBySlug = new Map(instructors.map((i) => [i.slug, i]))

function buildSessions(
  seed: WorkshopSeed,
  now: Date,
  userBooked: UserBookedSeats,
): WorkshopSession[] {
  return upcomingSessionDates(seed.schedule, now).map((startsAt) => {
    const id = sessionIdFor(seed.id, startsAt)
    const booked = demoBookedSeats(id, seed.capacityPerSession) + (userBooked.get(id) ?? 0)
    return {
      id,
      startsAt,
      capacity: seed.capacityPerSession,
      seatsLeft: Math.max(0, seed.capacityPerSession - booked),
    }
  })
}

function buildReviews(seed: WorkshopSeed): Review[] {
  const texts = [...reviewPool[seed.category], ...reviewPool.common]
  const hash = hashString(seed.id)
  return [0, 1, 2].map((i) => {
    const pick = (hash >>> (i * 4)) % texts.length
    return {
      id: `${seed.id}-r${i + 1}`,
      author: reviewAuthors[(hash + i * 3) % reviewAuthors.length]!,
      rating: i === 2 && seed.rating.average < 4.8 ? 4 : 5,
      // 評價日期以工作坊更新日往前推，確保不會出現「未來的評價」
      date: new Date(Date.parse(seed.updatedAt) - (i + 1) * 9 * 86_400_000).toISOString(),
      body: texts[(pick + i) % texts.length]!,
    }
  })
}

export function buildWorkshop(
  seed: WorkshopSeed,
  now: Date,
  userBooked: UserBookedSeats = EMPTY,
): FilterableWorkshop {
  const sessions = buildSessions(seed, now, userBooked)
  const instructor = instructorBySlug.get(seed.instructor)!
  return {
    id: seed.id,
    slug: seed.slug,
    title: seed.title,
    category: seed.category,
    categoryName: categoryName.get(seed.category)!,
    city: seed.city,
    cityName: cityName.get(seed.city)!,
    district: seed.district,
    level: seed.level,
    durationMinutes: seed.durationMinutes,
    price: seed.price,
    rating: seed.rating,
    image: workshopImageFor(seed.id),
    nextSession: sessions.find((s) => s.seatsLeft > 0) ?? null,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    summary: seed.summary,
    description: seed.description,
    learn: seed.learn,
    audience: seed.audience,
    agenda: seed.agenda,
    notes: seed.notes,
    faq: [...seed.faq, ...commonFaq],
    address: `${cityName.get(seed.city)}市${seed.district}（示範地址）`,
    capacityPerSession: seed.capacityPerSession,
    instructor: {
      slug: instructor.slug,
      name: instructor.name,
      studio: instructor.studio,
      title: instructor.title,
    },
    sessions,
    reviews: buildReviews(seed),
    searchText: `${instructor.name} ${instructor.studio}`,
  }
}

export function toSummary(workshop: Workshop): WorkshopSummary {
  return {
    id: workshop.id,
    slug: workshop.slug,
    title: workshop.title,
    category: workshop.category,
    categoryName: workshop.categoryName,
    city: workshop.city,
    cityName: workshop.cityName,
    district: workshop.district,
    level: workshop.level,
    durationMinutes: workshop.durationMinutes,
    price: workshop.price,
    rating: workshop.rating,
    image: workshop.image,
    nextSession: workshop.nextSession,
    createdAt: workshop.createdAt,
  }
}

function stripSearchText(workshop: FilterableWorkshop): Workshop {
  const { searchText: _searchText, ...rest } = workshop
  return rest
}

export function allWorkshops(now: Date, userBooked: UserBookedSeats = EMPTY): FilterableWorkshop[] {
  return workshops.map((seed) => buildWorkshop(seed, now, userBooked))
}

export function listWorkshops(query: WorkshopQuery, now: Date) {
  const result = paginate(filterWorkshops(allWorkshops(now), query), query.page, query.pageSize)
  return { ...result, items: result.items.map(toSummary) }
}

export function getWorkshop(
  slug: string,
  now: Date,
  userBooked: UserBookedSeats = EMPTY,
): Workshop | null {
  const seed = workshops.find((w) => w.slug === slug)
  return seed ? stripSearchText(buildWorkshop(seed, now, userBooked)) : null
}

export function findWorkshopSeed(
  predicate: (seed: WorkshopSeed) => boolean,
): WorkshopSeed | undefined {
  return workshops.find(predicate)
}

/** 相關工作坊：同分類優先，其次同城市，最多 4 筆 */
export function relatedWorkshops(workshop: Workshop, now: Date, limit = 4): WorkshopSummary[] {
  const score = (w: Workshop) =>
    (w.category === workshop.category ? 2 : 0) + (w.city === workshop.city ? 1 : 0)
  return allWorkshops(now)
    .filter((w) => w.id !== workshop.id && score(w) > 0)
    .sort((a, b) => score(b) - score(a) || b.rating.average - a.rating.average)
    .slice(0, limit)
    .map(toSummary)
}

export function listCategories(): Category[] {
  return categories.map((c) => ({
    ...c,
    workshopCount: workshops.filter((w) => w.category === c.slug).length,
  }))
}

export function listCities(): City[] {
  return cities.map((c) => ({
    ...c,
    workshopCount: workshops.filter((w) => w.city === c.slug).length,
  }))
}

export function listInstructors(): Instructor[] {
  return instructors
}

export function getInstructor(slug: string, now: Date) {
  const instructor = instructorBySlug.get(slug)
  if (!instructor) return null
  const items = allWorkshops(now)
    .filter((w) => w.instructor.slug === slug)
    .map(toSummary)
  return { instructor, workshops: items }
}

function toArticleSummary({
  body: _body,
  relatedWorkshopSlugs: _related,
  ...summary
}: Article): ArticleSummary {
  return summary
}

export function listArticles(): ArticleSummary[] {
  return [...articles]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .map(toArticleSummary)
}

export function getArticle(slug: string, now: Date) {
  const article = articles.find((a) => a.slug === slug)
  if (!article) return null
  const related = allWorkshops(now)
    .filter((w) => article.relatedWorkshopSlugs.includes(w.slug))
    .map(toSummary)
  return { article, related }
}

/** 全站搜尋：工作坊、講師、文章分組回傳，各組最多 6 筆 */
export function searchAll(q: string, now: Date) {
  const keyword = normalizeKeyword(q)
  const match = (...fields: string[]) => normalizeKeyword(fields.join(' ')).includes(keyword)
  return {
    workshops: filterWorkshops(allWorkshops(now), {
      q,
      sort: 'rating',
      page: 1,
      pageSize: 6,
    })
      .slice(0, 6)
      .map(toSummary),
    instructors: instructors.filter((i) => match(i.name, i.studio, i.title, i.bio)).slice(0, 6),
    articles: listArticles()
      .filter((a) => match(a.title, a.excerpt))
      .slice(0, 6),
  }
}
