/**
 * 預約的業務規則：名額檢查、金額計算、擁有者限制。
 *
 * 名額的計算方式：示範報名人數（seed 雜湊）＋「目前使用者自己的預約」。
 * 不把所有訪客的預約加總，否則示範網站會隨著訪客增加慢慢全部額滿，也會讓訪客互相影響（ADR-003 資料隔離）。
 *
 * IDOR 防護：預約只存在 user:{id}:bookings 底下，查詢時只會在自己的清單裡找，
 * 傳入別人的預約 id 只會得到 404，不會讀到或改到別人的資料。
 */
import type { Booking } from '#shared/types/domain'
import type { CreateBookingInput } from '#shared/schemas'
import { calculateTotal, canModifyBooking, FREE_CANCEL_HOURS } from '#shared/utils/booking'
import { getBookings, saveBookings, type UserRecord } from '../repositories/user-data.repository'
import { getWorkshop, type UserBookedSeats } from './catalog.service'
import { conflict, notFound } from '../utils/validation'

/** 使用者在每個場次已預約（且未取消）的人數 */
export function bookedSeatsBySession(bookings: Booking[], excludeId?: string): UserBookedSeats {
  const map = new Map<string, number>()
  for (const b of bookings) {
    if (b.status !== 'confirmed' || b.id === excludeId) continue
    map.set(b.sessionId, (map.get(b.sessionId) ?? 0) + b.quantity)
  }
  return map
}

export async function listBookings(user: UserRecord): Promise<Booking[]> {
  const bookings = await getBookings(user)
  return bookings.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}

export async function getBooking(user: UserRecord, id: string): Promise<Booking> {
  const booking = (await getBookings(user)).find((b) => b.id === id)
  return booking ?? notFound('找不到這筆預約')
}

export async function createBooking(
  user: UserRecord,
  input: CreateBookingInput,
  now = new Date(),
): Promise<Booking> {
  const bookings = await getBookings(user)
  const workshop =
    getWorkshop(input.workshopSlug, now, bookedSeatsBySession(bookings)) ??
    notFound('找不到這堂工作坊')
  const session = workshop.sessions.find((s) => s.id === input.sessionId)
  if (!session)
    conflict('這個場次已經結束或不存在，請重新選擇場次', { reason: 'session-unavailable' })

  // 名額不足回 409，前端據此提示並重新載入名額（docs/03-user-flow.md Flow 1）
  if (input.quantity > session.seatsLeft) {
    conflict(
      session.seatsLeft === 0
        ? '這個場次已經額滿，請選擇其他場次'
        : `名額不足，這個場次目前只剩 ${session.seatsLeft} 位`,
      { reason: 'insufficient-seats', seatsLeft: session.seatsLeft },
    )
  }

  const booking: Booking = {
    id: crypto.randomUUID().slice(0, 8),
    workshopId: workshop.id,
    workshopSlug: workshop.slug,
    workshopTitle: workshop.title,
    sessionId: session.id,
    startsAt: session.startsAt,
    quantity: input.quantity,
    // 單價取自伺服器上的工作坊資料，總額由伺服器計算；請求裡就算夾帶 price 也會被 Zod 移除
    unitPrice: workshop.price,
    total: calculateTotal(workshop.price, input.quantity),
    contact: input.contact,
    status: 'confirmed',
    createdAt: now.toISOString(),
  }
  await saveBookings(user, [...bookings, booking])
  return booking
}

function assertModifiable(booking: Booking, now: Date) {
  if (booking.status === 'cancelled') conflict('這筆預約已經取消')
  if (!canModifyBooking(booking, now)) {
    conflict(`開課前 ${FREE_CANCEL_HOURS} 小時內無法線上修改或取消，請直接聯繫開課者`)
  }
}

export async function updateBookingQuantity(
  user: UserRecord,
  id: string,
  quantity: number,
  now = new Date(),
): Promise<Booking> {
  const bookings = await getBookings(user)
  const booking = bookings.find((b) => b.id === id) ?? notFound('找不到這筆預約')
  assertModifiable(booking, now)

  // 計算名額時排除這筆預約本身，否則改人數時會把自己原本的名額也算成「已被佔用」
  const workshop = getWorkshop(
    booking.workshopSlug,
    now,
    bookedSeatsBySession(bookings, booking.id),
  )
  const session = workshop?.sessions.find((s) => s.id === booking.sessionId)
  if (!session) conflict('這個場次已經無法修改')
  if (quantity > session.seatsLeft) {
    conflict(`名額不足，最多可改為 ${session.seatsLeft} 位`, {
      reason: 'insufficient-seats',
      seatsLeft: session.seatsLeft,
    })
  }

  const updated: Booking = {
    ...booking,
    quantity,
    total: calculateTotal(booking.unitPrice, quantity),
  }
  await saveBookings(
    user,
    bookings.map((b) => (b.id === id ? updated : b)),
  )
  return updated
}

export async function cancelBooking(
  user: UserRecord,
  id: string,
  now = new Date(),
): Promise<Booking> {
  const bookings = await getBookings(user)
  const booking = bookings.find((b) => b.id === id) ?? notFound('找不到這筆預約')
  assertModifiable(booking, now)

  // 軟刪除：保留紀錄並標記為已取消，「已取消」分頁才看得到
  const cancelled: Booking = { ...booking, status: 'cancelled', cancelledAt: now.toISOString() }
  await saveBookings(
    user,
    bookings.map((b) => (b.id === id ? cancelled : b)),
  )
  return cancelled
}
