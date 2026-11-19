import { describe, expect, it } from 'vitest'
import { safeRedirect } from '~/utils/safe-redirect'

describe('safeRedirect', () => {
  it('允許站內路徑（含 query）', () => {
    expect(safeRedirect('/booking/abc?session=1')).toBe('/booking/abc?session=1')
  })

  it('拒絕外部網址與協定相對網址', () => {
    expect(safeRedirect('https://evil.example')).toBe('/account')
    expect(safeRedirect('//evil.example')).toBe('/account')
    expect(safeRedirect('/\\evil.example')).toBe('/account')
    expect(safeRedirect('javascript:alert(1)')).toBe('/account')
    expect(safeRedirect(['/a', '/b'])).toBe('/account')
  })
})
