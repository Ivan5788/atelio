/**
 * WCAG 2.x 對比度計算。
 * 設計規範頁（/dev/styleguide）即時顯示對比值，單元測試也用它來保證
 * 「允許的文字 × 底色組合」全部達到 4.5:1，避免日後改色時不小心破壞可及性。
 *
 * 公式：https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

const HEX_PATTERN = /^#([0-9a-f]{6})$/i

function channelToLinear(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** 相對亮度：0（純黑）到 1（純白） */
export function relativeLuminance(hex: string): number {
  const match = HEX_PATTERN.exec(hex)
  if (!match) {
    throw new Error(`Invalid hex color: "${hex}". Expected #RRGGBB.`)
  }
  const n = Number.parseInt(match[1]!, 16)
  const r = channelToLinear((n >> 16) & 0xff)
  const g = channelToLinear((n >> 8) & 0xff)
  const b = channelToLinear(n & 0xff)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 對比度：1（相同顏色）到 21（黑白），與前景／背景順序無關 */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

export type WcagLevel = 'AAA' | 'AA' | 'AA-large' | 'fail'

/** 一般文字：AA ≥ 4.5、AAA ≥ 7；大字（≥ 24px 或 ≥ 18.66px 粗體）與 UI 元件 ≥ 3 */
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA-large'
  return 'fail'
}
