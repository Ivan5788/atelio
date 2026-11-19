/**
 * 產生 iCalendar（.ics）內容，讓使用者把預約加入自己的行事曆。
 * 純前端產生，不需要後端 API；時間以 UTC 表示（結尾 Z），各行事曆會自動轉成使用者的時區。
 */
export interface CalendarEvent {
  uid: string
  title: string
  start: string
  durationMinutes: number
  location: string
  description: string
}

const toIcsDate = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

/** iCalendar 規定逗號、分號、反斜線與換行要跳脫 */
const escape = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, (m) => `\\${m}`)
    .replace(/\n/g, '\\n')

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const start = new Date(event.start)
  const end = new Date(start.getTime() + event.durationMinutes * 60_000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atelio//Workshop Booking//ZH-TW',
    'BEGIN:VEVENT',
    `UID:${event.uid}@atelio.demo`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(event.location)}`,
    `DESCRIPTION:${escape(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
