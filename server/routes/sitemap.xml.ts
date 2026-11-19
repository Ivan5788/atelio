/**
 * sitemap.xml：列出所有可索引的公開頁面與最後更新時間。
 * 內容由 seed 資料產生，新增工作坊或文章時會自動出現在 sitemap，不需要手動維護。
 *
 * 不開放索引時仍可存取（展示用），但 robots.txt 不會引用它，頁面本身也都是 noindex。
 */
import { CATEGORY_SLUGS, CITY_SLUGS } from '#shared/types/domain'
import { workshops } from '../data/workshops'
import { instructors } from '../data/taxonomy'
import { articles } from '../data/articles'

interface Entry {
  path: string
  lastmod?: string
}

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const latest = (dates: string[]) => dates.sort().at(-1)

  const entries: Entry[] = [
    { path: '/', lastmod: latest(workshops.map((w) => w.updatedAt)) },
    { path: '/workshops', lastmod: latest(workshops.map((w) => w.updatedAt)) },
    ...workshops.map((w) => ({ path: `/workshops/${w.slug}`, lastmod: w.updatedAt })),
    ...CATEGORY_SLUGS.map((slug) => ({
      path: `/categories/${slug}`,
      lastmod: latest(workshops.filter((w) => w.category === slug).map((w) => w.updatedAt)),
    })),
    ...CITY_SLUGS.map((slug) => ({
      path: `/cities/${slug}`,
      lastmod: latest(workshops.filter((w) => w.city === slug).map((w) => w.updatedAt)),
    })),
    { path: '/instructors' },
    ...instructors.map((i) => ({
      path: `/instructors/${i.slug}`,
      lastmod: latest(workshops.filter((w) => w.instructor === i.slug).map((w) => w.updatedAt)),
    })),
    { path: '/journal', lastmod: latest(articles.map((a) => a.updatedAt)) },
    ...articles.map((a) => ({ path: `/journal/${a.slug}`, lastmod: a.updatedAt })),
    { path: '/faq' },
    { path: '/about' },
    { path: '/for-organizers' },
  ]

  const body = entries
    .map((e) => {
      const loc = `<loc>${escapeXml(new URL(e.path, siteUrl).href)}</loc>`
      const lastmod = e.lastmod ? `<lastmod>${e.lastmod.slice(0, 10)}</lastmod>` : ''
      return `  <url>${loc}${lastmod}</url>`
    })
    .join('\n')

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
})
