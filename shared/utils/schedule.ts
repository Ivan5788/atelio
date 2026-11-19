/**
 * 示範場次的產生方式。
 *
 * Seed 資料如果寫死日期，部署幾週後所有場次都會變成「已結束」。
 * 所以 seed 只描述「每週幾、幾點開課」，實際日期在請求時依當下時間算出接下來的場次；
 * 已報名人數用場次 id 的雜湊值決定，同一個場次每次算出來都一樣（不會每次重新整理就變）。
 */
import { toTaipeiParts } from './format'

export interface ScheduleTemplate {
  /** 0 = 週日 */
  weekdays: number[]
  hour: number
  minute?: number
  /** 產生幾個場次 */
  count: number
}

const DAY_MS = 86_400_000
const TAIPEI_OFFSET_HOURS = 8

/** 依模板產生接下來的場次時間（ISO，UTC）。最早從 minLeadDays 天後開始，留時間給學員預約。 */
export function upcomingSessionDates(
  template: ScheduleTemplate,
  now: Date = new Date(),
  minLeadDays = 2,
): string[] {
  const today = toTaipeiParts(now)
  // 以「台北的今天 00:00」為基準，用 UTC 運算避免本機時區影響
  const base = Date.UTC(today.year, today.month - 1, today.day)
  const result: string[] = []

  for (
    let offset = minLeadDays;
    offset < minLeadDays + 180 && result.length < template.count;
    offset++
  ) {
    const day = new Date(base + offset * DAY_MS)
    if (!template.weekdays.includes(day.getUTCDay())) continue
    const startsAt = Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      template.hour - TAIPEI_OFFSET_HOURS,
      template.minute ?? 0,
    )
    result.push(new Date(startsAt).toISOString())
  }
  return result
}

/** 場次 id：工作坊 id + 台北日期與時間，例如 w01-20261214-1400 */
export function sessionIdFor(workshopId: string, iso: string): string {
  const p = toTaipeiParts(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${workshopId}-${p.year}${pad(p.month)}${pad(p.day)}-${pad(p.hour)}${pad(p.minute)}`
}

/** FNV-1a 32-bit：簡單、穩定的字串雜湊，只用來產生示範數字，不用於任何安全用途 */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** 示範的已報名人數：約 1/8 的場次額滿，其餘介於 0 到 capacity-1 */
export function demoBookedSeats(sessionId: string, capacity: number): number {
  const hash = hashString(sessionId)
  if (hash % 8 === 0) return capacity
  return (hash >>> 3) % capacity
}
