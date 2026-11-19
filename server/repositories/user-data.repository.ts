/**
 * 使用者產生的資料：存放在 Nitro storage `data`（正式環境為 Upstash Redis，本機為 memory）。
 *
 * Key 設計（ADR-003）：
 *   user:{id}                    帳號
 *   email:{email}                Email → userId 索引
 *   user:{id}:bookings           預約
 *   user:{id}:favorites          收藏（工作坊 slug）
 *   user:{id}:studio             Studio 的工作坊
 *
 * 同一個帳號的所有 key 使用同一個到期時間（建立帳號後 72 小時），
 * 之後寫入的 key 也只設定「剩餘」秒數，確保帳號與資料一起被刪除。
 *
 * 取捨：陣列整包讀出、修改、寫回，不是原子操作。同一位使用者同時送出兩個請求時可能互相覆蓋；
 * 每個帳號只有自己在操作，示範網站可以接受，正式產品應改用資料庫交易或 Redis 原子指令。
 */
import type { Booking, PublicUser, StudioWorkshop } from '#shared/types/domain'

export const ACCOUNT_TTL_SECONDS = 72 * 60 * 60

export interface UserRecord extends PublicUser {
  passwordHash: string
}

const storage = () => useStorage('data')

const keys = {
  user: (id: string) => `user:${id}`,
  email: (email: string) => `email:${email.toLowerCase()}`,
  bookings: (id: string) => `user:${id}:bookings`,
  favorites: (id: string) => `user:${id}:favorites`,
  studio: (id: string) => `user:${id}:studio`,
}

/** 距離帳號到期還剩幾秒（至少 1 秒，避免傳 0 變成永久保存） */
function remainingTtl(user: Pick<PublicUser, 'expiresAt'>): number {
  return Math.max(1, Math.floor((Date.parse(user.expiresAt) - Date.now()) / 1000))
}

async function setWithUserTtl(user: Pick<PublicUser, 'expiresAt'>, key: string, value: unknown) {
  await storage().setItem(key, value as never, { ttl: remainingTtl(user) })
}

// ── 帳號 ──────────────────────────────────────────────

export async function createUser(
  input: Omit<UserRecord, 'id' | 'createdAt' | 'expiresAt'>,
): Promise<UserRecord> {
  const now = Date.now()
  const user: UserRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ACCOUNT_TTL_SECONDS * 1000).toISOString(),
  }
  await setWithUserTtl(user, keys.user(user.id), user)
  await setWithUserTtl(user, keys.email(user.email), user.id)
  return user
}

/** memory driver 不支援 TTL，所以讀取時也檢查到期時間，本機與正式環境行為一致 */
function isExpired(user: PublicUser): boolean {
  return Date.parse(user.expiresAt) <= Date.now()
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const user = await storage().getItem<UserRecord>(keys.user(id))
  return user && !isExpired(user) ? user : null
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const id = await storage().getItem<string>(keys.email(email))
  return id ? findUserById(id) : null
}

export async function saveUser(user: UserRecord): Promise<void> {
  await setWithUserTtl(user, keys.user(user.id), user)
}

export function toPublicUser({ passwordHash: _hash, ...user }: UserRecord): PublicUser {
  return user
}

// ── 預約 ──────────────────────────────────────────────

export async function getBookings(user: PublicUser): Promise<Booking[]> {
  return (await storage().getItem<Booking[]>(keys.bookings(user.id))) ?? []
}

export async function saveBookings(user: PublicUser, bookings: Booking[]): Promise<void> {
  await setWithUserTtl(user, keys.bookings(user.id), bookings)
}

// ── 收藏 ──────────────────────────────────────────────

export async function getFavorites(user: PublicUser): Promise<string[]> {
  return (await storage().getItem<string[]>(keys.favorites(user.id))) ?? []
}

export async function saveFavorites(user: PublicUser, slugs: string[]): Promise<void> {
  await setWithUserTtl(user, keys.favorites(user.id), slugs)
}

// ── Studio ─────────────────────────────────────────────

export async function getStudioWorkshops(user: PublicUser): Promise<StudioWorkshop[] | null> {
  return storage().getItem<StudioWorkshop[]>(keys.studio(user.id))
}

export async function saveStudioWorkshops(
  user: PublicUser,
  items: StudioWorkshop[],
): Promise<void> {
  await setWithUserTtl(user, keys.studio(user.id), items)
}
