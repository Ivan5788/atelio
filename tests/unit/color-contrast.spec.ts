import { describe, expect, it } from 'vitest'
import { contrastRatio, relativeLuminance, wcagLevel } from '#shared/utils/color-contrast'

describe('relativeLuminance', () => {
  it('returns 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#FFFFFF')).toBe(1)
  })

  it('is case-insensitive', () => {
    expect(relativeLuminance('#5d493e')).toBe(relativeLuminance('#5D493E'))
  })

  it.each(['#FFF', 'FFFFFF', '#GGGGGG', 'rgb(0,0,0)'])('rejects invalid input %s', (input) => {
    expect(() => relativeLuminance(input)).toThrow('Invalid hex color')
  })
})

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
  })

  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#E6F8FF', '#E6F8FF')).toBe(1)
  })

  it('does not depend on argument order', () => {
    expect(contrastRatio('#5D493E', '#FDFFF5')).toBe(contrastRatio('#FDFFF5', '#5D493E'))
  })

  // 與 docs/06-design-system.md 記錄的數值交叉驗證
  it('matches documented values', () => {
    expect(contrastRatio('#5D493E', '#FDFFF5')).toBeCloseTo(8.36, 2)
    expect(contrastRatio('#78645D', '#FDEEC4')).toBeCloseTo(4.82, 2)
  })
})

describe('wcagLevel', () => {
  it.each([
    [7, 'AAA'],
    [4.5, 'AA'],
    [4.49, 'AA-large'],
    [3, 'AA-large'],
    [2.99, 'fail'],
  ] as const)('ratio %d → %s', (ratio, level) => {
    expect(wcagLevel(ratio)).toBe(level)
  })
})
