import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { inlineScriptHashes } from '../../server/utils/csp-hashes'

const sha = (s: string) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`

describe('inlineScriptHashes', () => {
  it('只計算會執行的內嵌腳本，略過外部腳本與 JSON 資料', () => {
    const html = [
      '<script type="importmap">{"imports":{}}</script>',
      '<script>window.__NUXT__={}</script>',
      '<script type="application/json" id="__NUXT_DATA__">[1]</script>',
      '<script type="application/ld+json">{"@type":"Course"}</script>',
      '<script type="module" src="/_nuxt/entry.js"></script>',
    ].join('')
    expect(inlineScriptHashes(html)).toEqual([sha('{"imports":{}}'), sha('window.__NUXT__={}')])
  })

  it('相同內容只產生一個 hash', () => {
    expect(inlineScriptHashes('<script>a()</script><script>a()</script>')).toHaveLength(1)
  })
})
