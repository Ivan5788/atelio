/**
 * 前後端共用的資料型別（API 契約）。
 * 前端只依賴這裡的型別，不 import server/ 的任何程式（docs/04-architecture.md 規則 4、6）。
 */

export const CATEGORY_SLUGS = [
  'ceramics',
  'leathercraft',
  'floral',
  'printmaking',
  'typography',
  'woodworking',
  'textile',
  'illustration',
] as const
export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export const CITY_SLUGS = [
  'taipei',
  'new-taipei',
  'taoyuan',
  'taichung',
  'tainan',
  'kaohsiung',
] as const
export type CitySlug = (typeof CITY_SLUGS)[number]

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type Level = (typeof LEVELS)[number]

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: '新手友善',
  intermediate: '需要基礎',
  advanced: '進階',
}

export const SORTS = ['upcoming', 'newest', 'price-asc', 'price-desc', 'rating'] as const
export type SortKey = (typeof SORTS)[number]

export const SORT_LABELS: Record<SortKey, string> = {
  upcoming: '即將開課',
  newest: '最新上架',
  'price-asc': '價格低到高',
  'price-desc': '價格高到低',
  rating: '評分最高',
}

export interface Category {
  slug: CategorySlug
  name: string
  /** 落地頁介紹文字（SEO／GEO 用的獨立內容） */
  intro: string
  workshopCount: number
}

export interface City {
  slug: CitySlug
  name: string
  intro: string
  workshopCount: number
}

export interface Instructor {
  slug: string
  name: string
  studio: string
  title: string
  bio: string
  yearsTeaching: number
  categories: CategorySlug[]
}

export interface WorkshopSession {
  id: string
  /** ISO 8601（UTC）。顯示時一律轉成 Asia/Taipei */
  startsAt: string
  capacity: number
  /** 剩餘名額（已扣除示範報名數與目前使用者自己的預約） */
  seatsLeft: number
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  body: string
}

export interface AgendaItem {
  /** 從開課起算的時間，例如 "00:40" */
  offset: string
  title: string
}

export interface FaqItem {
  question: string
  answer: string
}

export type WorkshopStatus = 'published' | 'draft'

/** 列表用的精簡資料，避免列表頁下載完整內容 */
export interface WorkshopSummary {
  id: string
  slug: string
  title: string
  category: CategorySlug
  categoryName: string
  city: CitySlug
  cityName: string
  district: string
  level: Level
  durationMinutes: number
  price: number
  rating: { average: number; count: number }
  /** 最近一個還有名額的場次；沒有則為 null */
  nextSession: WorkshopSession | null
  createdAt: string
}

export interface Workshop extends WorkshopSummary {
  summary: string
  description: string
  learn: string[]
  audience: string[]
  agenda: AgendaItem[]
  faq: FaqItem[]
  notes: string[]
  address: string
  capacityPerSession: number
  instructor: Pick<Instructor, 'slug' | 'name' | 'studio' | 'title'>
  sessions: WorkshopSession[]
  reviews: Review[]
  updatedAt: string
}

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'tip'; text: string }

export interface ArticleSummary {
  slug: string
  title: string
  excerpt: string
  kind: 'GUIDE' | 'COMPARE' | 'STORY'
  readMinutes: number
  category: CategorySlug
  author: string
  publishedAt: string
  updatedAt: string
}

export interface Article extends ArticleSummary {
  body: ArticleBlock[]
  relatedWorkshopSlugs: string[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ── 會員 ──────────────────────────────────────────────

export interface PublicUser {
  id: string
  name: string
  email: string
  isDemo: boolean
  phone?: string
  interests?: CategorySlug[]
  createdAt: string
  /** 帳號與所有資料的自動刪除時間 */
  expiresAt: string
}

export type BookingStatus = 'confirmed' | 'cancelled'

export interface Booking {
  id: string
  workshopId: string
  workshopSlug: string
  workshopTitle: string
  sessionId: string
  startsAt: string
  quantity: number
  unitPrice: number
  /** 由伺服器計算，不接受前端傳入（docs/05-security.md T 竄改） */
  total: number
  contact: { name: string; phone: string; note?: string }
  status: BookingStatus
  createdAt: string
  cancelledAt?: string
}

// ── Studio ─────────────────────────────────────────────

export interface StudioWorkshop {
  id: string
  slug: string
  title: string
  category: CategorySlug
  city: CitySlug
  district: string
  level: Level
  price: number
  durationMinutes: number
  capacityPerSession: number
  summary: string
  description: string
  status: WorkshopStatus
  sessions: { id: string; startsAt: string }[]
  bookedCount: number
  updatedAt: string
  /** seed：來自示範資料；custom：使用者自己新增 */
  origin: 'seed' | 'custom'
}

export interface StudioStats {
  kpis: {
    monthlyBookings: number
    monthlyBookingsChange: number
    monthlyRevenue: number
    averageRating: number
    fillRate: number
  }
  trend: { label: string; bookings: number }[]
  /** 各工作坊的報名佔比（示範開課者多為單一分類，以工作坊區分比分類更有資訊量） */
  workshopShare: { id: string; title: string; bookings: number }[]
}
