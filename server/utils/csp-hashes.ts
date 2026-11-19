/**
 * 計算 HTML 中「會執行」的內嵌 script 的 CSP hash（純函式，供 server/plugins/csp-ssr-hashes.ts 使用）。
 * type="application/json" 與 application/ld+json 是資料，瀏覽器不會執行，不需要 hash。
 */
import { createHash } from 'node:crypto'

const INLINE_SCRIPT_RE = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi
const DATA_TYPE_RE = /\btype="application\/(?:ld\+)?json"/i

export function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>()
  for (const [, attrs = '', body = ''] of html.matchAll(INLINE_SCRIPT_RE)) {
    if (!body || DATA_TYPE_RE.test(attrs)) continue
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
  return [...hashes]
}
