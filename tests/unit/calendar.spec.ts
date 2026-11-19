import { describe, expect, it } from 'vitest'
import { buildIcs } from '~/utils/calendar'

describe('buildIcs', () => {
  it('產生 UTC 時間與結束時間，並跳脫特殊字元', () => {
    const ics = buildIcs(
      {
        uid: 'abc',
        title: '拉坯入門；第一只茶碗',
        start: '2026-11-21T06:00:00.000Z',
        durationMinutes: 180,
        location: '台北市大安區, 示範地址',
        description: '第一行\n第二行',
      },
      new Date('2026-11-19T00:00:00.000Z'),
    )
    expect(ics).toContain('DTSTART:20261121T060000Z')
    expect(ics).toContain('DTEND:20261121T090000Z')
    expect(ics).toContain('SUMMARY:拉坯入門；第一只茶碗')
    expect(ics).toContain('LOCATION:台北市大安區\\, 示範地址')
    expect(ics).toContain('DESCRIPTION:第一行\\n第二行')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
  })
})
