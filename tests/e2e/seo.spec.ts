import { expect, test } from '@playwright/test'

/**
 * SEO／GEO 輸出的實測（Phase 5）。
 * 預設全站不開放索引（NUXT_PUBLIC_INDEXABLE 未設定），這裡同時驗證「SEO 技術都有輸出」與「確實 noindex」。
 * 只檢查伺服器回傳的 HTML（不執行 JS 的爬蟲看到的內容），一種裝置即可。
 */
test.skip(({ isMobile }) => isMobile, 'SEO 輸出與裝置無關，只跑一次')

function jsonLd(html: string): Record<string, any>[] {
  const blocks = [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ]
  return blocks.flatMap((m) => {
    const data = JSON.parse(m[1]!)
    return data['@graph'] ?? [data]
  })
}

const meta = (html: string, attr: 'name' | 'property', key: string) =>
  html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`))?.[1] ??
  html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${key}"`))?.[1]

test('every public page is noindex by default (header and meta)', async ({ request }) => {
  for (const path of [
    '/',
    '/workshops',
    '/workshops/wheel-throwing-basics-taipei',
    '/faq',
    '/journal',
  ]) {
    const res = await request.get(path)
    expect(res.headers()['x-robots-tag'], path).toContain('noindex')
    expect(meta(await res.text(), 'name', 'robots'), path).toBe('noindex, nofollow')
  }
})

test('workshop detail has canonical, Open Graph and Course structured data in the HTML', async ({
  request,
}) => {
  const html = await (await request.get('/workshops/wheel-throwing-basics-taipei?utm=test')).text()

  // canonical 不含 query string
  expect(html).toMatch(
    /<link[^>]*rel="canonical"[^>]*href="http:\/\/localhost:3000\/workshops\/wheel-throwing-basics-taipei"/,
  )
  expect(meta(html, 'property', 'og:title')).toBe('拉坯入門：做出第一只茶碗 | Atelio')
  expect(meta(html, 'property', 'og:image')).toMatch(
    /^https?:\/\/.+\/images\/workshops\/w01-1280\.webp$/,
  )
  expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image')
  expect(meta(html, 'name', 'description')).toContain('一對四小班制')

  const nodes = jsonLd(html)
  const types = nodes.map((n) => n['@type'])
  expect(types).toEqual(expect.arrayContaining(['Course', 'FAQPage', 'BreadcrumbList']))
  const course = nodes.find((n) => n['@type'] === 'Course')!
  expect(course.offers.priceCurrency).toBe('TWD')
  expect(course.hasCourseInstance.length).toBeGreaterThan(0)
})

test('home, list, FAQ, article and instructor pages output their schema types', async ({
  request,
}) => {
  const expectations: [string, string[]][] = [
    ['/', ['WebSite', 'Organization']],
    ['/workshops', ['ItemList', 'BreadcrumbList']],
    ['/categories/ceramics', ['CollectionPage', 'BreadcrumbList']],
    ['/faq', ['FAQPage']],
    ['/journal', ['Blog']],
    ['/journal/first-pottery-class-checklist', ['Article', 'BreadcrumbList']],
    ['/instructors/chen-yihe', ['ProfilePage', 'BreadcrumbList']],
  ]
  for (const [path, types] of expectations) {
    const nodes = jsonLd(await (await request.get(path)).text())
    expect(
      nodes.map((n) => n['@type']),
      path,
    ).toEqual(expect.arrayContaining(types))
  }
})

test('robots.txt allows crawling (so noindex is seen), blocks AI crawlers and omits the sitemap', async ({
  request,
}) => {
  const res = await request.get('/robots.txt')
  expect(res.headers()['content-type']).toContain('text/plain')
  const body = await res.text()
  // 一般爬蟲那一組（到第一個空行為止）不能整站封鎖，否則爬蟲讀不到 noindex
  const general = body.slice(body.indexOf('User-agent: *')).split('\n\n')[0]!
  expect(general).toContain('Disallow: /api/')
  expect(general).not.toMatch(/^Disallow: \/$/m)
  expect(body).toMatch(/User-agent: GPTBot\s+Disallow: \//)
  expect(body).not.toContain('Sitemap:')
})

test('sitemap.xml lists every public page generated from the data', async ({ request }) => {
  const res = await request.get('/sitemap.xml')
  expect(res.headers()['content-type']).toContain('application/xml')
  const xml = await res.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  expect(urls).toContain('http://localhost:3000/workshops/wheel-throwing-basics-taipei')
  expect(urls).toContain('http://localhost:3000/journal/first-pottery-class-checklist')
  expect(urls.some((u) => u!.includes('/account'))).toBe(false)
  // 首頁 + 列表 + 24 工作坊 + 8 分類 + 6 城市 + 講師列表 + 8 講師 + 專欄 + 4 文章 + FAQ／關於／開課者
  expect(urls).toHaveLength(1 + 1 + 24 + 8 + 6 + 1 + 8 + 1 + 4 + 3)
})

test('llms.txt describes the site and states the data is fictional', async ({ request }) => {
  const body = await (await request.get('/llms.txt')).text()
  expect(body.startsWith('# Atelio')).toBe(true)
  expect(body).toContain('虛構的示範資料')
  expect(body).toContain('/workshops/wheel-throwing-basics-taipei')
})
