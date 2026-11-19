/**
 * 顯示格式。所有日期一律以 Asia/Taipei 顯示：
 * 伺服器（Vercel 為 UTC）與使用者瀏覽器的時區可能不同，若用預設時區，
 * SSR 與 hydration 的文字會不一致，還可能把場次顯示成前一天。
 */
export const TIME_ZONE = 'Asia/Taipei'

const priceFormatter = new Intl.NumberFormat('zh-TW')

export function formatPrice(value: number): string {
  return `NT$ ${priceFormatter.format(value)}`
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  hourCycle: 'h23',
})

export interface TaipeiDateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** 0 = 週日 */
  weekday: number
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

export function toTaipeiParts(date: Date | string): TaipeiDateParts {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(date)).map((p) => [p.type, p.value]),
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAY_INDEX[parts.weekday as string] ?? 0,
  }
}

const ZH_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const EN_WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const EN_MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** 12/14 六 14:00 */
export function formatSessionShort(iso: string): string {
  const p = toTaipeiParts(iso)
  return `${p.month}/${p.day} ${ZH_WEEKDAYS[p.weekday]} ${pad(p.hour)}:${pad(p.minute)}`
}

/** 2026 年 12 月 14 日（六）14:00 */
export function formatSessionLong(iso: string): string {
  const p = toTaipeiParts(iso)
  return `${p.year} 年 ${p.month} 月 ${p.day} 日（${ZH_WEEKDAYS[p.weekday]}）${pad(p.hour)}:${pad(p.minute)}`
}

/** 2026/12/14 */
export function formatDate(iso: string): string {
  const p = toTaipeiParts(iso)
  return `${p.year}/${pad(p.month)}/${pad(p.day)}`
}

/** 票根用：{ mon: 'DEC', day: '14', weekday: 'SAT' } */
export function ticketDate(iso: string) {
  const p = toTaipeiParts(iso)
  return { mon: EN_MONTHS[p.month - 1]!, day: String(p.day), weekday: EN_WEEKDAYS[p.weekday]! }
}

/** 180 → 3 小時；90 → 1.5 小時 */
export function formatDuration(minutes: number): string {
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours} 小時` : `${Number(hours.toFixed(1))} 小時`
}

/** 剩餘名額文字與語氣（少於等於 3 位時提醒） */
export function seatsLabel(seatsLeft: number): {
  text: string
  tone: 'muted' | 'warning' | 'full'
} {
  if (seatsLeft <= 0) return { text: '額滿', tone: 'full' }
  if (seatsLeft <= 3) return { text: `剩 ${seatsLeft} 位`, tone: 'warning' }
  return { text: `剩 ${seatsLeft} 位`, tone: 'muted' }
}
