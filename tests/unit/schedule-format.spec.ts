import { describe, expect, it } from 'vitest'
import {
  demoBookedSeats,
  hashString,
  sessionIdFor,
  upcomingSessionDates,
} from '#shared/utils/schedule'
import {
  formatDuration,
  formatPrice,
  formatSessionShort,
  seatsLabel,
  ticketDate,
  toTaipeiParts,
} from '#shared/utils/format'

// 2026-11-19（四）10:00 台北時間 = 02:00 UTC
const NOW = new Date('2026-11-19T02:00:00.000Z')

describe('upcomingSessionDates', () => {
  it('依星期與時間產生台北時區的場次', () => {
    const dates = upcomingSessionDates({ weekdays: [6], hour: 14, count: 3 }, NOW)
    expect(dates).toEqual([
      // 週六 14:00 台北 = 06:00 UTC
      '2026-11-21T06:00:00.000Z',
      '2026-11-28T06:00:00.000Z',
      '2026-12-05T06:00:00.000Z',
    ])
  })

  it('最早從 minLeadDays 天後開始，不會產生太近的場次', () => {
    // 週五（明天）不算，因為預設至少 2 天後
    const dates = upcomingSessionDates({ weekdays: [5], hour: 19, count: 1 }, NOW)
    expect(dates[0]).toBe('2026-11-27T11:00:00.000Z')
  })

  it('台北凌晨的時間換算回 UTC 會是前一天', () => {
    const [first] = upcomingSessionDates({ weekdays: [6], hour: 7, count: 1 }, NOW)
    expect(first).toBe('2026-11-20T23:00:00.000Z')
    expect(toTaipeiParts(first!).weekday).toBe(6)
  })

  it('UTC 已是隔天、台北仍是今天時，以台北日期為準', () => {
    // 台北 11/19 23:30 = UTC 11/19 15:30
    const late = new Date('2026-11-19T15:30:00.000Z')
    expect(upcomingSessionDates({ weekdays: [6], hour: 14, count: 1 }, late)[0]).toBe(
      '2026-11-21T06:00:00.000Z',
    )
  })
})

describe('demo numbers', () => {
  it('雜湊與已報名人數是穩定的（同樣輸入、同樣結果）', () => {
    expect(hashString('w01')).toBe(hashString('w01'))
    expect(demoBookedSeats('w01-20261121-1400', 4)).toBe(demoBookedSeats('w01-20261121-1400', 4))
  })

  it('已報名人數不會超過名額', () => {
    for (let i = 0; i < 200; i++) {
      const booked = demoBookedSeats(`w${i}-x`, 6)
      expect(booked).toBeGreaterThanOrEqual(0)
      expect(booked).toBeLessThanOrEqual(6)
    }
  })

  it('場次 id 使用台北日期與時間', () => {
    expect(sessionIdFor('w01', '2026-11-21T06:00:00.000Z')).toBe('w01-20261121-1400')
  })
})

describe('format', () => {
  it('formatPrice 加上千分位', () => {
    expect(formatPrice(1800)).toBe('NT$ 1,800')
    expect(formatPrice(12000)).toBe('NT$ 12,000')
  })

  it('場次時間以台北時區顯示', () => {
    expect(formatSessionShort('2026-11-21T06:00:00.000Z')).toBe('11/21 六 14:00')
    expect(ticketDate('2026-11-21T06:00:00.000Z')).toEqual({
      mon: 'NOV',
      day: '21',
      weekday: 'SAT',
    })
  })

  it('formatDuration', () => {
    expect(formatDuration(180)).toBe('3 小時')
    expect(formatDuration(90)).toBe('1.5 小時')
  })

  it('剩餘名額 3 位以下顯示提醒語氣', () => {
    expect(seatsLabel(0)).toEqual({ text: '額滿', tone: 'full' })
    expect(seatsLabel(3).tone).toBe('warning')
    expect(seatsLabel(4).tone).toBe('muted')
  })
})
