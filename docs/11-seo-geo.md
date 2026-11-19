# Atelio SEO／GEO 實作

> 版本：v0.5（Phase 5）
> **本站預設不開放索引**：資料是虛構的，只展示 SEO 技術，不希望被無關的人搜尋到。
> 所有 SEO 輸出照常產生，可以用瀏覽器檢視原始碼、或貼到 Rich Results Test 的「程式碼」模式檢查。

## 1. 全站索引開關

| 環境變數 | 預設 | 作用 |
| --- | --- | --- |
| `NUXT_PUBLIC_INDEXABLE` | 未設定（= 不開放） | 設為 `true` 才開放索引；在建置時決定，修改後需重新部署 |
| `NUXT_PUBLIC_SITE_URL` | Vercel 正式網域，本機為 `http://localhost:3000` | canonical、Open Graph、sitemap 使用的絕對網址 |

| 輸出 | 不開放（預設） | 開放 |
| --- | --- | --- |
| `X-Robots-Tag` 標頭 | 所有回應 `noindex, nofollow` | 只有私人頁面與 API |
| `<meta name="robots">` | `noindex, nofollow` | 一般頁面 `index, follow, max-image-preview:large`；篩選結果與搜尋頁 `noindex, follow` |
| `robots.txt` | 允許一般爬蟲、封鎖 AI 訓練爬蟲、不列 sitemap | 允許爬取公開頁面、列出 sitemap |

**為什麼不用 `Disallow: /` 擋掉所有爬蟲？** robots.txt 只能阻止「爬取」，不能阻止「索引」。被擋住的爬蟲讀不到頁面上的 noindex，只要有外部連結，網址仍可能以「沒有說明」的形式出現在搜尋結果。所以允許爬取、讓爬蟲讀到 noindex，才是確實不被索引的做法。

**為什麼虛構資料不該開放索引？** 把不存在的課程、評分以結構化資料送進搜尋引擎，屬於誤導內容，也違反搜尋引擎的結構化資料規範。

## 2. 每頁的 meta（`app/composables/useSeo.ts`）

`usePageSeo()` 統一輸出：
- `title`（套用 `%s | Atelio`）、`description`
- `canonical`：一律是不含 query string 的絕對網址。例如 `/workshops?category=ceramics` 的 canonical 是 `/workshops`，`?utm=xxx` 也不會產生重複網址
- Open Graph／Twitter Card：工作坊頁使用該課程的 1280px 照片，其他頁使用 `public/images/og-default.jpg`（1200×630）
- `robots`：依全站開關與頁面性質決定（見上表）

私人頁面（會員、預約、Studio、登入）只在瀏覽器渲染，固定輸出 noindex。

## 3. 結構化資料（`shared/utils/structured-data.ts`）

產生器是純函式，有單元測試。頁面以 `useJsonLd()` 輸出，每段資料只輸出一個 `<script type="application/ld+json">`，多個節點放在 `@graph` 裡。

| 頁面 | Schema 類型 |
| --- | --- |
| 首頁 | `WebSite`（含站內搜尋 `SearchAction`）、`Organization` |
| 工作坊列表 | `ItemList` |
| 分類頁／城市頁 | `CollectionPage` + `ItemList` |
| 工作坊詳細頁 | `Course` + 每個場次的 `CourseInstance`（時間、地點、價格、名額狀態）、`AggregateRating`、`Review`、`FAQPage` |
| 講師頁 | `ProfilePage` + `Person` |
| 知識專欄／文章 | `Blog`／`Article`（作者、發布與更新日期） |
| FAQ | `FAQPage` |
| 關於 | `AboutPage`、`Organization` |
| 所有二層以上頁面 | `BreadcrumbList`（由麵包屑元件輸出，與畫面上的麵包屑同一份資料） |

安全性：JSON-LD 序列化時把 `<` 轉成 `<`，內容中出現 `</script>` 也無法提前結束標籤（有單元測試）。

結構化資料只幫助搜尋引擎理解內容，不保證出現複合式搜尋結果；Google 目前只對政府與醫療網站顯示 FAQ 複合式結果，這裡仍輸出 `FAQPage`，因為它也是 AI 搜尋理解問答的線索。

## 4. sitemap.xml、llms.txt

- `/sitemap.xml`（`server/routes/sitemap.xml.ts`）：由 seed 資料產生，共 57 個公開網址與 `lastmod`。新增工作坊或文章會自動出現，不需要手動維護。
- `/llms.txt`（`server/routes/llms.txt.ts`）：GEO（生成式引擎最佳化）。依社群提案格式（llmstxt.org），用 Markdown 向大型語言模型說明網站內容與重要頁面，開頭明確標示資料為虛構。目前還不是正式標準，各家 AI 是否讀取不一。

## 5. 讓爬蟲看得到內容（GEO 的基礎）

多數 AI 爬蟲不執行 JavaScript。公開頁面都在伺服器渲染或預先產生，HTML 一回傳就有完整內容（E2E 測試以「不執行 JS 的請求」檢查 11 個公開頁面的主要文字）。FAQ 使用 `<details>`，答案文字一開始就在 HTML 裡。

## 6. 驗證方式

| 項目 | 方式 |
| --- | --- |
| 結構化資料內容 | 單元測試 `tests/unit/structured-data.spec.ts` |
| 每頁實際輸出 | E2E `tests/e2e/seo.spec.ts`：noindex 標頭與 meta、canonical、OG、各頁 schema 類型、robots.txt、sitemap 網址數量、llms.txt |
| 開放索引模式 | 以 `NUXT_PUBLIC_INDEXABLE=true` 建置後實測：標頭消失、robots 變為 index、robots.txt 列出 sitemap、篩選頁仍為 `noindex, follow`、私人頁仍帶 noindex 標頭 |
| Rich Results Test | 網站不開放索引，請用「程式碼」模式：在頁面上檢視原始碼，複製 HTML 貼上檢查 |
