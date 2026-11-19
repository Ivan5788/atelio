/**
 * 設計 Token 的「護欄」測試：
 * 1. 規範允許的文字 × 底色組合，全部要達到 WCAG AA（4.5:1）。
 * 2. SCSS 編譯出的 CSS 變數，要與 tokens JSON（也是 Figma Variables 的來源）一致。
 *
 * 有人改了色碼卻破壞可及性、或只改了一邊忘了同步，CI 會直接失敗。
 */
import { describe, expect, it } from 'vitest'
import { compile } from 'sass'
import { fileURLToPath } from 'node:url'
import { contrastRatio } from '#shared/utils/color-contrast'
import {
  palette,
  semanticColors,
  TEXT_COLORS,
  GENERAL_BACKGROUNDS,
  RESTRICTED_BACKGROUNDS,
} from '~/utils/design-tokens'

const AA = 4.5

describe('text contrast rules', () => {
  const generalPairs = TEXT_COLORS.flatMap((text) =>
    GENERAL_BACKGROUNDS.map((bg) => [text, bg] as const),
  )

  it.each(generalPairs)('%s on %s ≥ 4.5', (text, bg) => {
    expect(contrastRatio(semanticColors[text]!, semanticColors[bg]!)).toBeGreaterThanOrEqual(AA)
  })

  const restrictedPairs = Object.entries(RESTRICTED_BACKGROUNDS).flatMap(([bg, texts]) =>
    texts.map((text) => [text, bg] as const),
  )

  it.each(restrictedPairs)('%s on %s (restricted background) ≥ 4.5', (text, bg) => {
    expect(contrastRatio(semanticColors[text]!, semanticColors[bg]!)).toBeGreaterThanOrEqual(AA)
  })

  it('inverse text on inverse background ≥ 4.5', () => {
    expect(
      contrastRatio(semanticColors['text-inverse']!, semanticColors['bg-inverse']!),
    ).toBeGreaterThanOrEqual(AA)
  })

  it('danger button text ≥ 4.5', () => {
    expect(
      contrastRatio(semanticColors['action-danger-fg']!, semanticColors['action-danger-bg']!),
    ).toBeGreaterThanOrEqual(AA)
  })

  it('form border on surface ≥ 3 (WCAG 1.4.11 non-text contrast)', () => {
    expect(
      contrastRatio(semanticColors['border-strong']!, semanticColors['bg-surface']!),
    ).toBeGreaterThanOrEqual(3)
  })
})

describe('SCSS output stays in sync with tokens JSON', () => {
  const entry = fileURLToPath(
    new URL('../../app/assets/styles/base/_custom-properties.scss', import.meta.url),
  )
  const css = compile(entry).css

  function cssVar(name: string): string | undefined {
    const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(css)
    return match?.[1]?.trim()
  }

  it.each(Object.entries(palette))('--palette-%s equals %s', (name, hex) => {
    expect(cssVar(`palette-${name}`)?.toUpperCase()).toBe(hex.toUpperCase())
  })

  it.each(Object.keys(semanticColors))('--color-%s is defined', (name) => {
    const value = cssVar(`color-${name}`)
    expect(value).toMatch(/^var\(--palette-[\w-]+\)$/)
    const referenced = value!.slice('var(--palette-'.length, -1)
    expect(palette[referenced]?.toUpperCase()).toBe(semanticColors[name]!.toUpperCase())
  })
})
