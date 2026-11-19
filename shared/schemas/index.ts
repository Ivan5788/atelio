/**
 * Zod schema：前後端共用（ADR-009）。
 * - 後端：驗證所有輸入，不信任前端。
 * - 前端：表單即時驗證，錯誤訊息與後端一致。
 * - 型別：以 z.infer 推導，schema 與型別不會不同步。
 */
import { z } from 'zod'
import { CATEGORY_SLUGS, CITY_SLUGS, LEVELS, SORTS } from '../types/domain'

// Zod 內建錯誤訊息（未自訂訊息的欄位）使用繁體中文
z.config(z.locales.zhTW())

const MAX_PRICE = 100_000

/** 逗號分隔的多選參數：?category=ceramics,floral → ['ceramics', 'floral'] */
function csvEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .string()
    .max(200)
    .transform((value) => value.split(',').filter(Boolean))
    .pipe(z.array(z.enum(values)).max(values.length))
}

// ── 工作坊列表查詢 ─────────────────────────────────────
export const workshopQuerySchema = z
  .object({
    q: z.string().trim().max(50).optional(),
    category: csvEnum(CATEGORY_SLUGS).optional(),
    city: z.enum(CITY_SLUGS).optional(),
    level: csvEnum(LEVELS).optional(),
    priceMin: z.coerce.number().int().min(0).max(MAX_PRICE).optional(),
    priceMax: z.coerce.number().int().min(0).max(MAX_PRICE).optional(),
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式應為 YYYY-MM-DD')
      .optional(),
    sort: z.enum(SORTS).default('upcoming'),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    // 分頁上限 50，避免一次要求大量資料（docs/05-security.md C-06）
    pageSize: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine((v) => v.priceMin === undefined || v.priceMax === undefined || v.priceMin <= v.priceMax, {
    message: '最低價不可高於最高價',
    path: ['priceMin'],
  })
export type WorkshopQuery = z.infer<typeof workshopQuerySchema>

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, '請輸入關鍵字').max(50),
})

export const slugParamSchema = z.object({
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]+$/),
})

export const idParamSchema = z.object({
  id: z
    .string()
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),
})

// ── 會員 ──────────────────────────────────────────────
const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Email 格式不正確'))

// 密碼規則：至少 8 字元，含英文字母與數字（docs/05-security.md C-14）
export const passwordSchema = z
  .string()
  .min(8, '密碼至少 8 個字元')
  .max(72, '密碼最多 72 個字元')
  .regex(/[A-Za-z]/, '密碼需包含英文字母')
  .regex(/\d/, '密碼需包含數字')

export const nameSchema = z.string().trim().min(1, '請輸入姓名').max(30, '姓名最多 30 個字')

export const registerSchema = z
  .object({
    name: nameSchema,
    email,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: '兩次輸入的密碼不一致',
    path: ['confirmPassword'],
  })
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email,
  // 登入不檢查密碼規則：規則改變後舊帳號仍要能登入，而且錯誤訊息不該透露規則
  password: z.string().min(1, '請輸入密碼').max(72),
})
export type LoginInput = z.infer<typeof loginSchema>

// 台灣手機號碼：09 開頭共 10 碼，允許中間有 - 或空白
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^09\d{8}$/, '請輸入 09 開頭的 10 碼手機號碼'))

export const profileSchema = z.object({
  name: nameSchema,
  phone: z.union([z.literal(''), phoneSchema]).optional(),
  interests: z.array(z.enum(CATEGORY_SLUGS)).max(CATEGORY_SLUGS.length).default([]),
})
export type ProfileInput = z.infer<typeof profileSchema>

// ── 預約 ──────────────────────────────────────────────
export const MAX_BOOKING_QUANTITY = 6

export const quantitySchema = z.coerce
  .number()
  .int()
  .min(1, '至少 1 位')
  .max(MAX_BOOKING_QUANTITY, `每筆預約最多 ${MAX_BOOKING_QUANTITY} 位`)

export const contactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  note: z.string().trim().max(200, '備註最多 200 個字').optional(),
})
export type ContactInput = z.infer<typeof contactSchema>

// 注意：沒有 price／total 欄位。金額一律由伺服器依工作坊價格計算。
export const createBookingSchema = z.object({
  workshopSlug: slugParamSchema.shape.slug,
  sessionId: idParamSchema.shape.id,
  quantity: quantitySchema,
  contact: contactSchema,
})
export type CreateBookingInput = z.infer<typeof createBookingSchema>

export const updateBookingSchema = z.object({
  quantity: quantitySchema,
})

// ── Studio ─────────────────────────────────────────────
export const studioSessionSchema = z.object({
  id: z.string().max(64).optional(),
  startsAt: z.iso
    .datetime({ offset: true, message: '請選擇有效的日期與時間' })
    .refine((value) => Date.parse(value) > Date.now(), '場次時間需晚於現在'),
})

export const studioWorkshopSchema = z.object({
  title: z.string().trim().min(4, '標題至少 4 個字').max(40, '標題最多 40 個字'),
  category: z.enum(CATEGORY_SLUGS, { message: '請選擇分類' }),
  city: z.enum(CITY_SLUGS, { message: '請選擇城市' }),
  district: z.string().trim().min(1, '請輸入行政區').max(10),
  level: z.enum(LEVELS, { message: '請選擇難度' }),
  summary: z.string().trim().min(10, '摘要至少 10 個字').max(80, '摘要最多 80 個字'),
  description: z
    .string()
    .trim()
    .min(30, '課程介紹至少 30 個字')
    .max(2000, '課程介紹最多 2000 個字'),
  price: z.coerce
    .number()
    .int('價格需為整數')
    .min(100, '價格至少 NT$ 100')
    .max(MAX_PRICE, '價格過高'),
  durationMinutes: z.coerce.number().int().min(30, '至少 30 分鐘').max(720, '最多 12 小時'),
  capacityPerSession: z.coerce.number().int().min(1, '至少 1 人').max(40, '每班最多 40 人'),
  sessions: z.array(studioSessionSchema).min(1, '至少新增一個場次').max(12, '最多 12 個場次'),
  status: z.enum(['published', 'draft']),
})
export type StudioWorkshopInput = z.infer<typeof studioWorkshopSchema>

export const studioStatusSchema = z.object({
  status: z.enum(['published', 'draft']),
})

export const studioListQuerySchema = z.object({
  q: z.string().trim().max(50).optional(),
  status: z.enum(['all', 'published', 'draft']).default('all'),
  sort: z.enum(['updated', 'title', 'price', 'booked']).default('updated'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})
export type StudioListQuery = z.infer<typeof studioListQuerySchema>

/** 把 Zod 錯誤轉成 { 欄位: 第一則訊息 }，前端表單與 API 錯誤共用 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    result[key] ??= issue.message
  }
  return result
}
