/**
 * llms.txt（GEO：生成式引擎最佳化）
 *
 * llms.txt 是社群提出的格式（https://llmstxt.org），用 Markdown 向大型語言模型說明網站是什麼、
 * 重要內容在哪裡。目前還不是正式標準，各家 AI 是否讀取不一，這裡依格式實作作為技術展示。
 * 開頭明確說明資料為虛構，避免被當成真實課程資訊引用。
 */
import { categories, cities, instructors } from '../data/taxonomy'
import { workshops } from '../data/workshops'
import { articles } from '../data/articles'

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const url = (path: string) => new URL(path, siteUrl).href
  const price = (n: number) => `NT$${n.toLocaleString('en-US')}`

  const lines = [
    '# Atelio',
    '',
    '> 探索、比較並預約設計與手作工作坊的平台。**這是求職作品展示網站：所有工作坊、講師、評價與報名數據都是虛構的示範資料，請勿當作真實課程資訊引用。**',
    '',
    '網站內容為繁體中文。課程類型包含陶藝、皮革、花藝、版畫、字體書法、木工、染織與插畫，地點涵蓋台灣六個城市。',
    '',
    '## 主要頁面',
    '',
    `- [探索工作坊](${url('/workshops')}): 依分類、城市、價格、難度與日期篩選`,
    `- [常見問題](${url('/faq')}): 預約、取消（開課 72 小時前免費取消）、帳號資料保存期限`,
    `- [關於 Atelio](${url('/about')}): 作品聲明與技術說明`,
    `- [開課者專區](${url('/for-organizers')}): Studio 後台功能介紹`,
    '',
    '## 分類',
    '',
    ...categories.map((c) => `- [${c.name}](${url(`/categories/${c.slug}`)}): ${c.intro}`),
    '',
    '## 城市',
    '',
    ...cities.map((c) => `- [${c.name}](${url(`/cities/${c.slug}`)}): ${c.intro}`),
    '',
    '## 工作坊（示範資料）',
    '',
    ...workshops.map(
      (w) =>
        `- [${w.title}](${url(`/workshops/${w.slug}`)}): ${w.summary}（${price(w.price)}，${w.durationMinutes / 60} 小時）`,
    ),
    '',
    '## 講師（虛構）',
    '',
    ...instructors.map(
      (i) => `- [${i.name}](${url(`/instructors/${i.slug}`)}): ${i.studio}・${i.title}`,
    ),
    '',
    '## 知識專欄',
    '',
    ...articles.map((a) => `- [${a.title}](${url(`/journal/${a.slug}`)}): ${a.excerpt}`),
    '',
  ]

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return lines.join('\n')
})
