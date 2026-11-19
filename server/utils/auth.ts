/**
 * 授權檢查（docs/05-security.md C-03）。
 *
 * Session Cookie 只證明「這個人登入過」；資料庫裡的帳號可能已經過了 72 小時被刪除，
 * 所以每次都要確認帳號仍然存在，不存在就清掉 Session 並回 401。
 */
import type { H3Event } from 'h3'
import { findUserById, type UserRecord } from '../repositories/user-data.repository'

export async function requireUser(event: H3Event): Promise<UserRecord> {
  const session = await requireUserSession(event, { message: '請先登入' })
  const user = await findUserById(session.user.id)
  if (!user) {
    await clearUserSession(event)
    throw createError({
      statusCode: 401,
      message: '登入已過期，示範帳號會在 72 小時後自動刪除，請重新登入',
    })
  }
  return user
}

/** 選擇性取得使用者：未登入時回 null，不拋錯 */
export async function getOptionalUser(event: H3Event): Promise<UserRecord | null> {
  const session = await getUserSession(event)
  return session.user ? findUserById(session.user.id) : null
}

/** 登入成功後寫入加密 Session Cookie（httpOnly、Secure、SameSite=Lax 由 nuxt-auth-utils 設定） */
export async function startSession(event: H3Event, user: UserRecord) {
  // replace 而不是 set：登入時換掉舊的 Session 內容，避免沿用登入前的資料（Session fixation）
  await replaceUserSession(event, {
    user: { id: user.id, name: user.name, isDemo: user.isDemo },
    loggedInAt: new Date().toISOString(),
  })
}
