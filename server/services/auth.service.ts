/**
 * 帳號：註冊、登入、一鍵 Demo 帳號（docs/05-security.md C-01、C-14）。
 */
import type { Booking } from '#shared/types/domain'
import type { LoginInput, RegisterInput } from '#shared/schemas'
import { canModifyBooking } from '#shared/utils/booking'
import {
  createUser,
  findUserByEmail,
  saveBookings,
  saveFavorites,
  type UserRecord,
} from '../repositories/user-data.repository'
import { allWorkshops } from './catalog.service'
import { conflict } from '../utils/validation'

/**
 * 帳號不存在時也執行一次密碼驗證，讓「帳號不存在」與「密碼錯誤」花費差不多的時間，
 * 避免攻擊者用回應時間判斷某個 Email 是否註冊過。
 */
let dummyHash: Promise<string> | undefined

export async function register(input: RegisterInput): Promise<UserRecord> {
  if (await findUserByEmail(input.email)) {
    // 註冊時無法避免透露「已註冊」：使用者需要知道原因才能改用登入。
    // 登入失敗則不透露（見 login），並以速率限制降低被大量探測的風險（C-05）。
    conflict('這個 Email 已經註冊過，請直接登入', {
      fieldErrors: { email: '這個 Email 已經註冊過' },
    })
  }
  return createUser({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    isDemo: false,
  })
}

export async function login(input: LoginInput): Promise<UserRecord | null> {
  const user = await findUserByEmail(input.email)
  if (!user) {
    dummyHash ??= hashPassword('atelio-timing-equalizer-0')
    await verifyPassword(await dummyHash, input.password)
    return null
  }
  return (await verifyPassword(user.passwordHash, input.password)) ? user : null
}

/**
 * 一鍵 Demo 帳號：每次都建立一個新的獨立帳號，訪客之間的資料互不影響。
 * 預先放入一筆已完成、一筆即將到來的預約與兩筆收藏，讓面試官一登入就能看到完整的會員中心。
 */
export async function createDemoAccount(now = new Date()): Promise<UserRecord> {
  const suffix = crypto.randomUUID().slice(0, 6)
  const user = await createUser({
    name: '示範學員',
    email: `demo-${suffix}@atelio.demo`,
    // 隨機密碼：Demo 帳號只能透過一鍵登入使用，無法用密碼登入
    passwordHash: await hashPassword(crypto.randomUUID()),
    isDemo: true,
  })

  const workshops = allWorkshops(now)
  const upcomingSource = workshops.find((w) =>
    w.sessions.some(
      (s) =>
        s.seatsLeft >= 2 && canModifyBooking({ status: 'confirmed', startsAt: s.startsAt }, now),
    ),
  )
  const pastSource =
    workshops.find((w) => w.slug === 'hand-stitched-wallet-taichung') ?? workshops[0]!
  const bookings: Booking[] = []

  if (upcomingSource) {
    const session = upcomingSource.sessions.find(
      (s) =>
        s.seatsLeft >= 2 && canModifyBooking({ status: 'confirmed', startsAt: s.startsAt }, now),
    )!
    bookings.push({
      id: crypto.randomUUID().slice(0, 8),
      workshopId: upcomingSource.id,
      workshopSlug: upcomingSource.slug,
      workshopTitle: upcomingSource.title,
      sessionId: session.id,
      startsAt: session.startsAt,
      quantity: 2,
      unitPrice: upcomingSource.price,
      total: upcomingSource.price * 2,
      contact: { name: '示範學員', phone: '0900000000' },
      status: 'confirmed',
      createdAt: now.toISOString(),
    })
  }

  const pastStart = new Date(now.getTime() - 12 * 86_400_000).toISOString()
  bookings.push({
    id: crypto.randomUUID().slice(0, 8),
    workshopId: pastSource.id,
    workshopSlug: pastSource.slug,
    workshopTitle: pastSource.title,
    sessionId: `${pastSource.id}-past`,
    startsAt: pastStart,
    quantity: 1,
    unitPrice: pastSource.price,
    total: pastSource.price,
    contact: { name: '示範學員', phone: '0900000000' },
    status: 'confirmed',
    createdAt: new Date(now.getTime() - 20 * 86_400_000).toISOString(),
  })

  await saveBookings(user, bookings)
  await saveFavorites(user, ['dried-flower-wreath-tainan', 'letterpress-business-cards-taipei'])
  return user
}
