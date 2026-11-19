/**
 * 預約的業務規則（純函式）：前端用來決定按鈕是否可按、顯示在哪個分頁；
 * 後端用同一份規則做最終判斷。前端的判斷只是提示，後端才是真正的把關。
 */
import type { Booking } from '../types/domain'

/** 開課前多少小時內不能線上取消或修改 */
export const FREE_CANCEL_HOURS = 72

export type BookingPhase = 'upcoming' | 'completed' | 'cancelled'

export function bookingPhase(
  booking: Pick<Booking, 'status' | 'startsAt'>,
  now: Date = new Date(),
): BookingPhase {
  if (booking.status === 'cancelled') return 'cancelled'
  return Date.parse(booking.startsAt) > now.getTime() ? 'upcoming' : 'completed'
}

/** 是否還能線上取消或修改人數 */
export function canModifyBooking(
  booking: Pick<Booking, 'status' | 'startsAt'>,
  now: Date = new Date(),
): boolean {
  if (booking.status !== 'confirmed') return false
  return Date.parse(booking.startsAt) - now.getTime() >= FREE_CANCEL_HOURS * 3_600_000
}

export function calculateTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity
}
