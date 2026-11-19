/**
 * 讀取 design/tokens/atelio.tokens.json（W3C DTCG 格式），解析 {primitive.color.xxx}
 * 這類參照，輸出扁平的 { 名稱: 色碼 } 物件。
 *
 * 這份 JSON 同時是 Figma Variables 的匯入來源，所以設計稿、SCSS、設計規範頁
 * 三者都追溯到同一個檔案。
 */
import tokens from '../../design/tokens/atelio.tokens.json'

type TokenNode = { $value?: unknown; [key: string]: unknown }

const REFERENCE_PATTERN = /^\{(.+)\}$/

function lookup(path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node && typeof node === 'object' && key in node) {
      return (node as Record<string, unknown>)[key]
    }
    throw new Error(`Unresolved token reference: {${path}}`)
  }, tokens)
}

function resolveValue(value: unknown, seen: Set<string> = new Set()): unknown {
  if (typeof value !== 'string') return value
  const match = REFERENCE_PATTERN.exec(value)
  if (!match) return value
  const path = match[1]!
  if (seen.has(path)) throw new Error(`Circular token reference: {${path}}`)
  seen.add(path)
  const target = lookup(path) as TokenNode
  return resolveValue(target.$value, seen)
}

/** 把巢狀的色彩群組攤平成 { 'bg-page': '#FDFFF5', ... } */
function flattenColors(group: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith('$') || !node || typeof node !== 'object') continue
    const name = prefix ? `${prefix}-${key}` : key
    if ('$value' in node) {
      result[name] = String(resolveValue((node as TokenNode).$value))
    } else {
      Object.assign(result, flattenColors(node as Record<string, unknown>, name))
    }
  }
  return result
}

export const palette: Record<string, string> = flattenColors(tokens.primitive.color)
export const semanticColors: Record<string, string> = flattenColors(tokens.semantic.color)

/** 只用於色塊與裝飾、不作為文字底色的語意色前綴 */
export const DECORATIVE_PREFIXES = ['category-'] as const

/**
 * 文字色 × 底色的使用規則（對應 docs/06-design-system.md 2.2 節）。
 * - 一般底色：所有文字色都可以使用。
 * - 飽和色塊：只允許列出的文字色。
 */
export const TEXT_COLORS = [
  'text-default',
  'text-muted',
  'text-link',
  'status-success-fg',
  'status-warning-fg',
  'status-danger-fg',
  'status-info-fg',
] as const

export const GENERAL_BACKGROUNDS = [
  'bg-page',
  'bg-surface',
  'bg-sunken',
  'bg-ticket',
  'bg-organizer',
  'bg-selected',
  'action-primary-bg',
  'action-primary-bg-hover',
  'status-info-bg',
] as const

export const RESTRICTED_BACKGROUNDS: Record<string, readonly string[]> = {
  'action-accent': ['text-default', 'action-accent-fg'],
  'status-danger-bg': ['text-default', 'status-danger-fg'],
  'border-dashed': ['text-default'], // latte 當色塊底
}
