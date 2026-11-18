# Atelio 系統架構與技術決策

> 版本：v0.1（Phase 1）・決策以 ADR（Architecture Decision Record）形式記錄，方便面試時說明「為什麼」。

## 1. 技術棧

| 類別 | 選擇 | 版本（規劃時） |
| --- | --- | --- |
| 框架 | Nuxt（Vue 3 + Vite + Vue Router） | 4.6.x |
| 語言 | TypeScript（strict） | 5.x |
| 狀態管理 | Pinia（`@pinia/nuxt`） | 3.x / 1.x |
| 樣式 | SCSS + CSS Custom Properties（設計 Token） | Dart Sass |
| 圖表 | Chart.js（僅 Studio 頁面動態載入） | 4.6.x |
| SEO | Nuxt 內建 `useSeoMeta` / `useHead` + 自建 JSON-LD composable | — |
| 圖片 | `@nuxt/image` | — |
| 字體 | `@nuxt/fonts`（自行託管 Noto Serif TC、IBM Plex Mono） | — |
| 圖示 | Lucide（只引入使用到的 SVG 圖示） | — |
| 後端 API | Nuxt Server Routes（Nitro），部署為 Vercel Functions | 隨 Nuxt |
| 資料庫 | Upstash Redis（透過 Vercel Marketplace 整合） | `@upstash/redis` 1.41.x |
| 輸入驗證 | Zod（前後端共用 schema） | 4.x |
| 驗證／Session | `nuxt-auth-utils`（加密 Session Cookie、scrypt 密碼雜湊） | 0.6.x |
| 安全標頭 | `nuxt-security`（CSP、安全標頭、請求大小限制） | 2.7.x |
| 速率限制 | `@upstash/ratelimit` | 2.x |
| 程式品質 | ESLint（`@nuxt/eslint`）+ Prettier | — |
| 測試 | Vitest + Vue Test Utils（單元／元件）、Playwright（E2E） | — |
| 版本控制 / CI | Git（Conventional Commits）+ GitHub Actions | — |
| 部署 | Vercel（Hobby 方案） | — |

**刻意不使用**：UI 套件（Element Plus、Vuetify…）、Tailwind、Axios、日期大型函式庫。理由見 ADR。
資安相關設計詳見 [05-security.md](05-security.md)。

---

## 2. 架構決策紀錄（ADR）

### ADR-001：使用 Nuxt 而非純 Vite SPA
- **背景**：Vue + Vite 預設為 SPA，伺服器回傳的 HTML 只有 `<div id="app"></div>`。Google 雖能執行 JS，但會延遲渲染、且多數 AI 爬蟲（如 GPTBot、PerplexityBot）**不執行 JavaScript**，看不到內容。
- **決策**：使用 Nuxt，以 `routeRules` 做混合渲染：公開內容頁 Prerender / SWR，私人頁面 CSR。
- **取捨**：Nuxt 有 auto-import 等「魔法」，對新手較不透明。→ 對策：關鍵處明確 `import`、在文件說明 Nuxt 慣例與底層對應（`pages/` = Vue Router 路由表）。
- **替代方案**：vite-ssg（動態路由需手動列舉、無 API 層）、Vite SSR 手動實作（維護成本高）。

### ADR-002：以 Nuxt Server Routes（Nitro）實作後端 REST API
- **背景**：專案需要一個真正會驗證、會授權、會寫入資料庫的基礎後端，而不是只回傳假資料的 mock。
- **決策**：在 `server/api/` 實作 RESTful API（GET/POST/PATCH/DELETE），與前端放在同一個 repo、同一次部署（Vercel 會把它包成 Serverless Functions）。分三層：
  - `server/api/*`：路由處理器（Handler），只負責「解析請求 → 呼叫 service → 回應」。
  - `server/services/*`：業務規則（例如：名額是否足夠、是否為該工作坊擁有者）。
  - `server/repositories/*`：資料存取（讀 seed、讀寫 Redis），可替換成 PostgreSQL 而不影響上層。
- **前端分離**：前端只透過 `app/services/` 呼叫 HTTP API，不 import 任何 `server/` 程式。未來換成獨立後端時，只需改 `NUXT_PUBLIC_API_BASE`。
- **為什麼不做獨立後端（Express／NestJS）**：Vercel 上要多維護一個專案、多處理 CORS 與跨網域 Cookie；對前端職缺來說，同 repo 的 Nitro API 已足以展示 API 設計與資安觀念。

### ADR-003：資料儲存——Seed 唯讀資料 + Upstash Redis + 示範資料隔離
- **Vercel 限制**：Functions 是無狀態的，每次請求可能在不同機器執行；檔案系統唯讀（`/tmp` 不保證保留）。**因此 memory／fs 儲存在正式環境無法使用**，必須接外部資料庫。
- **兩類資料分開處理**：
  1. **公開內容**（工作坊、講師、文章、分類）：唯讀 seed 資料，在建置時打包進程式碼（以 `import` 引入 JSON，而不是執行時讀檔，避免 Vercel 上找不到檔案路徑）。
  2. **使用者產生的資料**（帳號、預約、收藏、開課者新增的工作坊）：存放在 Upstash Redis。
- **隔離與自動清除**：每個帳號（含一鍵 Demo 帳號）的資料以 `user:{id}:*` 為 key 前綴，並設定 **72 小時 TTL** 自動過期。讀取時合併「seed 資料 + 該使用者的變更」，所以訪客 A 刪除的工作坊不會影響訪客 B，作品也不會越用越亂。
- **為什麼選 Redis 而不是 PostgreSQL**：資料結構簡單、需要自動過期（Redis 內建 TTL，PostgreSQL 需要排程清除），而且 Upstash 以 HTTP 連線，非常適合 Serverless（不會有連線池耗盡的問題）。保留 repository 層，日後可改接 Neon PostgreSQL。
- **本機開發**：沒有設定 Upstash 環境變數時，自動改用 Nitro 的 memory 儲存，讓專案 clone 下來不需要任何帳號就能跑。
- **誠實揭露**：網站上明確說明「此為示範網站，您的資料會在 72 小時後自動刪除，請勿輸入真實個人資料」。

### ADR-004：不使用 Axios，改用 Nuxt `$fetch` / `useFetch`
- `useFetch` 會在 SSR 時取得資料並序列化到 HTML，Hydration 時不重複請求；Axios 需自行處理這件事。
- 自建 `services/http.ts` 統一處理 baseURL、錯誤格式轉換（轉為 `ApiError` 類別）、401 導向登入。
- 面試說明重點：能解釋 SSR 資料「重複請求」問題與 `useFetch` 的解法。

### ADR-005：自建元件庫，不使用 UI 框架
- 作品目的是展示元件設計能力；也避免 UI 框架帶來的制式外觀與大量未使用 CSS。
- 所有共用元件以 `Base` 前綴（`BaseButton`、`BaseModal`…），需具備：型別化 Props/Emits、`v-model`、鍵盤操作、ARIA 屬性。

### ADR-006：SCSS + CSS Custom Properties 雙層 Token
- **SCSS**：負責編譯時能力——mixin（斷點、文字樣式）、函式、模組化（`@use`）。
- **CSS 變數**：負責執行時能力——主題（深色模式）、元件層級覆寫。
- Token 只定義一次（SCSS map），再輸出成 CSS 變數，避免兩邊數值不同步。

### ADR-007：Chart.js 並動態載入
- 只有 Studio 需要圖表，且 Studio 為 CSR，圖表元件以 `defineAsyncComponent` / `<ClientOnly>` 延遲載入，不影響公開頁面 bundle。
- 選 Chart.js 而非 ECharts：功能足夠、gzip 後體積較小、可 tree-shaking 註冊需要的圖表類型。

### ADR-008：部署於 Vercel
- Nuxt 在 Vercel 上不需額外設定（自動使用 Nitro 的 `vercel` preset）：Prerender 頁面放 CDN、SSR 與 API 變成 Vercel Functions。
- **快取策略改用 `isr` 而非 `swr`**：Nitro 的 `swr` 把快取存在 Function 記憶體裡，Serverless 環境下快取會隨機消失；`isr` 則使用 Vercel 的 ISR，快取存在 CDN、所有使用者共用。
- **注意 ISR 會忽略 query string**：`/workshops?category=ceramics` 若使用 ISR，所有篩選條件都會拿到同一份快取。因此 `/workshops` 列表維持每次請求 SSR，只有 slug 頁面用 ISR。
- **方案**：Hobby（免費）方案限非商業用途，個人求職作品符合。超過免費額度時服務會暫停，而不是自動扣款。
- **Preview 部署**：開啟 Vercel Deployment Protection，只有正式網址公開，避免開發中的版本被存取。

### ADR-009：Zod 作為前後端共用的驗證 schema
- 同一份 schema（`shared/schemas/`）：後端用來驗證所有輸入（**不信任前端**），前端用來做即時表單驗證，TypeScript 型別也從 schema 推導（`z.infer`），三者永遠一致。
- 面試說明重點：「前端驗證是為了使用者體驗，後端驗證才是為了安全。」

### ADR-010：使用 `nuxt-auth-utils` 處理 Session，而不是自己寫 JWT
- 提供加密的 Session Cookie（`httpOnly`、`Secure`、`SameSite=Lax`）與 scrypt 密碼雜湊，由 Nuxt 核心團隊成員維護。
- 不把 JWT 存在 `localStorage`：任何 XSS 都能讀取 `localStorage`，但讀不到 `httpOnly` Cookie。
- 自己實作加密與雜湊是常見的資安錯誤來源，使用經過審視的函式庫比較安全。

---

## 3. 渲染策略（routeRules 草案，以 Vercel 為準）

```ts
// nuxt.config.ts（草案，Phase 3 實作）
routeRules: {
  // 建置時產生靜態 HTML，放在 CDN
  '/': { prerender: true },
  '/faq': { prerender: true },
  '/about': { prerender: true },
  '/for-organizers': { prerender: true },
  '/journal/**': { prerender: true },
  '/instructors': { prerender: true },

  // Vercel ISR：第一次請求時渲染，之後 CDN 快取 1 小時
  '/workshops/**': { isr: 3600 },
  '/categories/**': { isr: 3600 },
  '/cities/**': { isr: 3600 },
  '/instructors/**': { isr: 3600 },
  // '/workshops'（列表本身）不設定 → 每次請求 SSR，篩選 query 才會生效

  // 私人頁面：只在瀏覽器渲染，並加上 noindex header
  '/booking/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
  '/account/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
  '/studio/**': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
  '/login': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },
  '/register': { ssr: false, headers: { 'X-Robots-Tag': 'noindex' } },

  // API 不快取、不索引
  '/api/**': { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
}
```

> ISR 頁面快取的是**公開內容**（seed 資料），不含任何使用者資料。使用者相關內容（收藏狀態等）在瀏覽器端另外取得，避免把 A 的資料快取給 B 看到。

---

## 4. 資料夾結構（規劃）

```text
atelio-workshop-platform/
├─ app/                        # Nuxt 4 前端原始碼
│  ├─ assets/styles/           # SCSS：tokens、mixins、base、utilities
│  ├─ components/
│  │  ├─ base/                 # 共用 UI 元件（BaseButton、BaseModal…），無業務邏輯
│  │  ├─ layout/               # Header、Footer、Sidebar、Breadcrumb
│  │  ├─ workshop/             # 業務元件：WorkshopCard、WorkshopFilters…
│  │  ├─ booking/
│  │  ├─ account/
│  │  └─ studio/
│  ├─ composables/             # useSeo、useJsonLd、useToast、useQueryState…
│  ├─ layouts/                 # default、account、studio
│  ├─ middleware/              # auth.ts（路由守衛）
│  ├─ pages/                   # 檔案即路由
│  ├─ services/                # API 呼叫層：http.ts、workshop.service.ts…
│  ├─ stores/                  # Pinia：auth、favorites、booking-draft、toast
│  ├─ utils/                   # 純函式：formatPrice、validators…（可單元測試）
│  ├─ app.vue
│  └─ error.vue                # 404 / 500 錯誤頁
├─ server/
│  ├─ api/                     # REST API 路由處理器
│  ├─ services/                # 業務規則（名額檢查、擁有權檢查）
│  ├─ repositories/            # 資料存取（seed + Redis），可替換
│  ├─ middleware/              # 速率限制、Origin 檢查
│  ├─ data/                    # Seed 資料（虛構，建置時打包）
│  ├─ utils/                   # 錯誤處理、分頁與篩選邏輯
│  └─ routes/                  # sitemap.xml、robots.txt、llms.txt
├─ shared/
│  ├─ types/                   # 前後端共用 TypeScript 型別（API 契約）
│  └─ schemas/                 # Zod 驗證 schema（前後端共用）
├─ .github/workflows/          # CI：lint、typecheck、test、npm audit
├─ public/                     # 靜態檔案、og 圖片
├─ tests/
│  ├─ unit/
│  └─ e2e/
├─ docs/                       # 本系列文件
└─ nuxt.config.ts
```

**分層規則（Code Review 檢查點）**
1. `pages/` 只負責組合元件與取得資料，不寫複雜邏輯。
2. `components/base/` 不得呼叫 API 或使用業務 Store。
6. `app/` 不得 import `server/` 的任何檔案；機密只能放在 `runtimeConfig` 的私有區塊，不可放 `runtimeConfig.public`。
3. 元件不直接呼叫 `$fetch`，一律透過 `services/`。
4. 型別定義集中在 `shared/types/`，前端與 server 共用同一份 API 契約。
5. 可以獨立測試的邏輯（篩選、驗證、金額計算）放 `utils/`，寫成純函式。

---

## 5. API 概要（詳細於 Phase 4 撰寫 `docs/api.md`）

| Method | Endpoint | 說明 |
| --- | --- | --- |
| GET | `/api/workshops` | 列表：`q`、`category`、`city`、`priceMin`、`priceMax`、`level`、`dateFrom`、`sort`、`page`、`pageSize` |
| GET | `/api/workshops/:slug` | 詳細 |
| GET | `/api/categories`、`/api/cities` | 分類、城市（含落地頁介紹文字） |
| GET | `/api/instructors`、`/api/instructors/:slug` | 講師 |
| GET | `/api/articles`、`/api/articles/:slug` | 知識文章 |
| GET | `/api/search?q=` | 全站搜尋 |
| POST | `/api/auth/demo`、`/api/auth/register`、`/api/auth/login`、`/api/auth/logout` | 一鍵 Demo 帳號、註冊、登入、登出 |
| GET | `/api/me` | 目前使用者 |
| GET/POST | `/api/me/bookings` | 我的預約／建立預約（名額不足回 409） |
| PATCH/DELETE | `/api/me/bookings/:id` | 修改人數／取消 |
| GET/PUT/DELETE | `/api/me/favorites/:workshopId` | 收藏 |
| GET/POST | `/api/studio/workshops` | 開課者工作坊 |
| PATCH/DELETE | `/api/studio/workshops/:id` | 編輯／刪除 |
| GET | `/api/studio/stats` | 後台統計 |

**統一錯誤格式**

```ts
interface ApiErrorBody {
  statusCode: number
  message: string                       // 給使用者看的訊息（繁中）
  data?: { fieldErrors?: Record<string, string> } // 表單欄位錯誤
}
```

---

## 6. 開發規範

- **命名**：元件 PascalCase；composable `useXxx`；store `useXxxStore`；檔案 kebab-case（元件除外）。
- **元件**：一律 `<script setup lang="ts">`，Props 用 `defineProps<T>()` 型別宣告，Emits 用 `defineEmits<{…}>()`。
- **樣式**：`<style scoped lang="scss">`，類別命名採 BEM（`.workshop-card__title`），只使用 Token，不寫死色碼與間距。
- **Git**：Conventional Commits（`feat:`、`fix:`、`docs:`、`refactor:`、`test:`、`chore:`），每個 Phase 至少一個有意義的 commit。
- **完成定義（DoD）**：功能可操作 + 型別無錯誤 + Lint 通過 + 有對應狀態（loading/empty/error）+ RWD 檢查 + 鍵盤可操作。
