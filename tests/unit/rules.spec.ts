import { describe, expect, it } from 'vitest'
import {
  createBookingSchema,
  loginSchema,
  phoneSchema,
  registerSchema,
  studioWorkshopSchema,
  toFieldErrors,
} from '#shared/schemas'
import { bookingPhase, calculateTotal, canModifyBooking } from '#shared/utils/booking'
import type { Booking, StudioWorkshop } from '#shared/types/domain'
import { bookedSeatsBySession } from '../../server/services/booking.service'
import { computeStudioStats } from '../../server/services/studio.service'
import { createMemoryLimiter } from '../../server/utils/rate-limit'

const NOW = new Date('2026-11-19T02:00:00.000Z')
const hoursLater = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString()

describe('auth schemas', () => {
  it('密碼需至少 8 字元並包含英文與數字', () => {
    const base = { name: '小安', email: 'a@example.com', confirmPassword: '' }
    const check = (password: string) =>
      registerSchema.safeParse({ ...base, password, confirmPassword: password }).success
    expect(check('short1')).toBe(false)
    expect(check('onlyletters')).toBe(false)
    expect(check('12345678')).toBe(false)
    expect(check('atelio2026')).toBe(true)
  })

  it('確認密碼不一致時，錯誤標在 confirmPassword 欄位', () => {
    const result = registerSchema.safeParse({
      name: '小安',
      email: 'a@example.com',
      password: 'atelio2026',
      confirmPassword: 'atelio2027',
    })
    expect(result.success).toBe(false)
    expect(toFieldErrors(result.error!)).toHaveProperty('confirmPassword')
  })

  it('Email 會轉成小寫並去除空白', () => {
    expect(loginSchema.parse({ email: '  A@Example.COM ', password: 'x' }).email).toBe(
      'a@example.com',
    )
  })

  it('手機號碼允許空白與連字號', () => {
    expect(phoneSchema.parse('0912-345 678')).toBe('0912345678')
    expect(phoneSchema.safeParse('02-1234-5678').success).toBe(false)
  })
})

describe('booking rules', () => {
  const booking = (startsAt: string, status: Booking['status'] = 'confirmed') => ({
    startsAt,
    status,
  })

  it('createBookingSchema 會移除前端夾帶的 price／total 欄位', () => {
    const parsed = createBookingSchema.parse({
      workshopSlug: 'wheel-throwing-basics-taipei',
      sessionId: 'w01-20261121-1400',
      quantity: 2,
      contact: { name: '小安', phone: '0912345678' },
      price: 0,
      total: 0,
    })
    expect(parsed).not.toHaveProperty('price')
    expect(parsed).not.toHaveProperty('total')
  })

  it('人數上限為 6 位', () => {
    const input = {
      workshopSlug: 'a',
      sessionId: 'b',
      contact: { name: '小安', phone: '0912345678' },
    }
    expect(createBookingSchema.safeParse({ ...input, quantity: 7 }).success).toBe(false)
    expect(createBookingSchema.safeParse({ ...input, quantity: 0 }).success).toBe(false)
  })

  it('開課前 72 小時內不能修改或取消', () => {
    expect(canModifyBooking(booking(hoursLater(73)), NOW)).toBe(true)
    expect(canModifyBooking(booking(hoursLater(71)), NOW)).toBe(false)
    expect(canModifyBooking(booking(hoursLater(100), 'cancelled'), NOW)).toBe(false)
  })

  it('預約分頁：即將到來／已完成／已取消', () => {
    expect(bookingPhase(booking(hoursLater(1)), NOW)).toBe('upcoming')
    expect(bookingPhase(booking(hoursLater(-1)), NOW)).toBe('completed')
    expect(bookingPhase(booking(hoursLater(10), 'cancelled'), NOW)).toBe('cancelled')
  })

  it('金額計算', () => {
    expect(calculateTotal(1800, 3)).toBe(5400)
  })

  it('已取消的預約不佔名額；修改人數時排除自己', () => {
    const list = [
      { id: 'a', sessionId: 's1', quantity: 2, status: 'confirmed' },
      { id: 'b', sessionId: 's1', quantity: 1, status: 'confirmed' },
      { id: 'c', sessionId: 's1', quantity: 4, status: 'cancelled' },
    ] as Booking[]
    expect(bookedSeatsBySession(list).get('s1')).toBe(3)
    expect(bookedSeatsBySession(list, 'a').get('s1')).toBe(1)
  })
})

describe('studio', () => {
  const valid = {
    title: '拉坯進階：大碗',
    category: 'ceramics',
    city: 'taipei',
    district: '大安區',
    level: 'intermediate',
    summary: '練習拉出直徑 20 公分以上的大碗。',
    description: '這堂課適合已經能穩定拉出茶碗的學員，練習更大尺寸的器形與收口技巧，並學習修坯。',
    price: '2400',
    durationMinutes: '180',
    capacityPerSession: '4',
    sessions: [{ startsAt: '2026-12-20T14:00:00+08:00' }],
    status: 'draft',
  }

  it('表單 schema 會把字串數字轉型，並要求至少一個場次', () => {
    expect(studioWorkshopSchema.parse(valid).price).toBe(2400)
    expect(studioWorkshopSchema.safeParse({ ...valid, sessions: [] }).success).toBe(false)
  })

  it('統計只計算已上架的工作坊', () => {
    const item = (id: string, status: StudioWorkshop['status']): StudioWorkshop => ({
      id,
      slug: id,
      title: id,
      category: 'ceramics',
      city: 'taipei',
      district: '大安區',
      level: 'beginner',
      price: 1000,
      durationMinutes: 120,
      capacityPerSession: 4,
      summary: '',
      description: '',
      status,
      sessions: [{ id: `${id}-s1`, startsAt: hoursLater(48) }],
      bookedCount: 2,
      updatedAt: NOW.toISOString(),
      origin: 'seed',
    })
    const all = computeStudioStats([item('w01', 'published'), item('w02', 'published')], NOW)
    const one = computeStudioStats([item('w01', 'published'), item('w02', 'draft')], NOW)
    expect(all.trend).toHaveLength(6)
    expect(one.kpis.monthlyBookings).toBeLessThan(all.kpis.monthlyBookings)
    expect(one.workshopShare.map((s) => s.id)).toEqual(['w01'])
    expect(all.kpis.fillRate).toBe(50)
  })
})

describe('memory rate limiter', () => {
  it('超過上限後拒絕，視窗結束後恢復', async () => {
    let t = 0
    const limiter = createMemoryLimiter(2, 1000, () => t)
    expect((await limiter.limit('ip')).success).toBe(true)
    expect((await limiter.limit('ip')).success).toBe(true)
    expect((await limiter.limit('ip')).success).toBe(false)
    expect((await limiter.limit('other-ip')).success).toBe(true)
    t = 1001
    expect((await limiter.limit('ip')).success).toBe(true)
  })
})
