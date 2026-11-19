/**
 * robots.txt：依全站開關輸出兩種版本。
 *
 * 不開放索引（預設）時，刻意「不用 Disallow: / 擋一般搜尋引擎」：
 * robots.txt 只能阻止爬取，不能阻止索引。被擋住的爬蟲看不到頁面上的 noindex，
 * 只要有外部連結指向本站，網址仍可能以「沒有說明文字」的形式出現在搜尋結果。
 * 正確做法是允許爬取、讓爬蟲讀到 noindex（本站同時有 X-Robots-Tag 標頭與 meta）。
 *
 * AI 訓練用的爬蟲不一定遵守 noindex，所以在不開放時另外以 Disallow 擋下。
 */
const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'CCBot',
  'Google-Extended',
  'PerplexityBot',
  'Bytespider',
]

export default defineEventHandler((event) => {
  const { siteUrl, indexable } = useRuntimeConfig(event).public
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

  // 私人頁面與 API 不需要被爬取
  const privatePaths = ['/api/', '/account', '/booking', '/studio', '/login', '/register', '/dev/']
  const lines = ['User-agent: *', ...privatePaths.map((p) => `Disallow: ${p}`), '']

  if (indexable) {
    lines.push(`Sitemap: ${new URL('/sitemap.xml', siteUrl).href}`)
  } else {
    lines.unshift('# 本站為使用虛構資料的作品展示網站，所有頁面皆設定 noindex。', '')
    for (const bot of AI_CRAWLERS) lines.push(`User-agent: ${bot}`, 'Disallow: /', '')
  }
  return lines.join('\n')
})
