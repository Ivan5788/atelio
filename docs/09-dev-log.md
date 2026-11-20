# 開發紀錄

記錄每個階段實際做了什麼、遇到的問題與決策理由。所有數字都是實際執行結果。

---

## Phase 2 — 視覺設計（2026-11-19）

- 配色經過 v0.1 工坊手記 → v0.2 粉彩初版 → v0.3 求職者自選主色票 → v0.3.1 加深 ink（`#7D685C` → `#5D493E`）→ v0.3.2 加深 ink-muted（`#84706A` → `#78645D`）。
- v0.3.2 的理由：舊的次要文字色在票根、淺灰、天空藍底上不到 4.5:1，原本靠「禁止組合」規則避開。規則容易在開發時被忘記，所以直接把顏色修正到全部通過。
- 產出 Figma 建檔規格（[08-figma-spec.md](08-figma-spec.md)）與 DTCG 格式的 Token 檔（`design/tokens/atelio.tokens.json`）。

## Phase 3 — 專案初始化（2026-11-19）

### 做了什麼
- 以官方 `nuxi init`（minimal 模板）建立 Nuxt 4.6.4 專案，模組以 `nuxi module add` 安裝，讓工具自動挑選相容版本。
- `nuxt.config.ts`：routeRules 混合渲染、nuxt-security 安全標頭與 CSP、Upstash／memory 儲存切換、字型只下載標題與數字用的兩套。
- SCSS 分層：`abstracts/`（token、函式、mixin，不輸出 CSS）→ `base/`（CSS 變數、reset、排版、工具類別）。
- `BaseButton` 元件與 `/dev/styleguide` 設計規範頁（色票與對比度由 Token JSON 即時計算）。
- 測試：Vitest（unit／nuxt 兩個 project）、Playwright（desktop／mobile 兩種裝置）；GitHub Actions CI。

### 問題與決策
| 問題 | 處理 |
| --- | --- |
| 本機 Node 22.14 低於 Nuxt 4.6.4 要求的 `^22.22.3` | 用已安裝的 fnm 另外安裝 Node 24.22.3（沒有更改系統預設版本），並新增 `.node-version`，CI 與 Vercel 也讀這個檔 |
| TypeScript 最新版為 7.x，vue-tsc 依賴 TS 的 JS API | 鎖定 `typescript@^6.0.3`，與 Nuxt 本身使用的版本一致 |
| nuxt-security 內建限流使用記憶體，在 Serverless 上無效 | 關閉，Phase 4 改用 `@upstash/ratelimit` |
| Prerender／ISR 頁面被 CDN 快取，CSP nonce 會失效 | 關閉 nonce，靜態頁使用 script hash；SSR 頁暫以 `'unsafe-inline'` 放行，Phase 6 實測後記錄 |
| 建置警告：Vite 改用 oxc，esbuild 的 `drop: console` 被忽略 | 關閉 nuxt-security 的 `removeLoggers`，以免誤以為有作用；console 由 ESLint 把關 |
| routeRules 預先列出的 `/faq`、`/about` 等頁面尚未建立，prerender 時 404 導致建置失敗 | 暫時註解，Phase 4 頁面完成後啟用 |
| `/api/health` 是公開端點 | 只做讀取、不寫入，避免被用來消耗資料庫寫入額度 |
| 字級用 px 時，使用者調大瀏覽器字級不會生效 | mixin 輸出 rem（WCAG 1.4.4） |

### 實際執行結果
| 檢查 | 結果 |
| --- | --- |
| `npm run lint` | 0 錯誤 |
| `npm run typecheck` | 通過 |
| `npm test` | 3 個檔案、158 個測試通過 |
| `npm run build` | 成功，prerender `/`、`/dev/styleguide` |
| `npm run test:e2e` | 12 個測試通過（6 個情境 × desktop／mobile） |
| 設計規範頁 1440px／390px | 無 console 錯誤、無水平捲軸（Playwright 檢查） |

**Token 護欄的驗證**：把 ink-muted 暫時改回舊值 `#84706A` 執行測試，有 8 個測試失敗（7 組對比不足＋SCSS 與 JSON 不一致），證明測試確實能攔下退步；驗證後已還原。

### 尚未處理
- `npm audit` 結果尚未逐項評估（Phase 6）。
- Vercel 部署與環境變數設定由求職者本人操作（Phase 7）。

---

## Phase 4 — 功能開發（2026-11-19）

### 做了什麼
分成五個 commit，每個都通過 lint、型別檢查與測試才提交：

1. **資料層與 API**：共用型別與 Zod schema、24 堂虛構工作坊（場次依當下時間產生）、catalog／booking／studio／auth 四個 service、Redis 資料以 `user:{id}:*` 隔離並設 72 小時 TTL、Origin／Content-Type／大小檢查與速率限制。API 規格見 [10-api.md](10-api.md)。
2. **版面與公開頁面**：Header、Footer、Demo 提示列、登入提示、Toast、換頁朗讀（`NuxtRouteAnnouncer`）；Base 元件（Input、Select、Modal、Tabs、Quantity、Pagination、Skeleton、EmptyState）；首頁、列表（篩選同步網址）、詳細頁、分類頁、城市頁、搜尋頁。
3. **會員流程**：登入、註冊、預約三步驟（草稿存 Pinia、409 時回到第一步）、預約完成頁（可下載 .ics）、會員中心、我的預約（修改人數／取消 Modal）、收藏、個人資料。
4. **Studio**：KPI、報名趨勢折線圖、各工作坊報名數長條圖（Chart.js 動態載入、附表格檢視）、工作坊表格（搜尋、篩選、排序、上架開關、刪除）、新增／編輯表單（動態場次、錯誤摘要、未儲存提醒）。
5. **資訊頁**：講師列表與講師頁、知識專欄與文章頁、FAQ、關於、開課者介紹；重新啟用 prerender 規則。

### 問題與決策
| 問題 | 處理 |
| --- | --- |
| Seed 若寫死日期，部署幾週後場次全部過期 | Seed 只寫「每週幾、幾點」，請求時依當下時間產生場次；已報名人數用場次 id 雜湊決定，每次結果相同 |
| 首頁有「近期場次」，prerender 會凍結在建置當天 | 首頁改為 ISR（每小時重新產生），sitemap 文件同步更新 |
| 所有訪客的預約若一起扣名額，示範網站會慢慢全部額滿，訪客之間也互相影響 | 名額 = 容量 − 示範報名數 − **自己的**預約 |
| 詳細頁被 ISR 快取，若在伺服器讀 Session，A 的資料可能被快取給 B | 公開 API 不讀 Session；個人化名額另外由 `/api/workshops/:slug/sessions` 在瀏覽器取得；登入狀態設為 `loadStrategy: 'client-only'` |
| 列表頁 `/workshops/**` 的 ISR 規則也會比對到 `/workshops` 本身 | 明確設定 `'/workshops': { isr: false }`；以 Vercel preset 建置後檢查 `.vercel/output/config.json`，確認 `/workshops` 走 SSR、詳細頁走 ISR |
| nuxt-auth-utils 0.6 的金鑰來源是 Nuxt `appSecret`，不是規劃時寫的 `NUXT_SESSION_PASSWORD` | `.env.example`、CI、資安文件改為 `NUXT_APP_SECRET` |
| nuxt-security 的請求大小限制不檢查 PATCH | 自己的 `01.api-guard.ts` 對所有變更請求檢查 100 KB 上限 |
| **開發時實測：瀏覽 8 個頁面就被限流（429）**。伺服器渲染與 payload 預載會在內部呼叫公開 API，約 200 次 | 只對會讀寫 Redis 的端點限流（`/api/me`、`/api/studio`、個人化名額、登入類）。公開目錄 API 不碰資料庫，對它限流反而每次都要花一次 Redis 指令 |
| **E2E 抓到：送出按鈕按了沒反應**。滑鼠按下時欄位 blur → 顯示錯誤訊息把按鈕往下推 → 放開時已不在按鈕上 | `useZodForm` 在 pointerdown（早於 blur）偵測到按下送出按鈕時，略過那一次 blur 驗證 |
| **E2E 抓到：`/workshops/nope` 回傳 HTTP 200 的空白頁**。Nuxt 4 的 `useAsyncData` 會把錯誤收進 `error`，不會中斷渲染 | 新增 `usePageData`：await 後檢查 `error`，以 fatal 錯誤回傳真正的 404 |
| 手機版 Studio 表格與我的預約出現水平捲軸 | 外框 grid 在手機也使用 `minmax(0, 1fr)`，表格在自己的捲動容器內捲動 |
| 詳細頁只為了一個常數從 schema 檔匯入，連帶載入整個 Zod（88.7 KB） | 常數移到 `shared/utils/booking.ts`；重新建置後確認 Zod 只出現在列表頁與表單頁 |
| 示範課程用真實照片容易被誤認為真的課程，也有授權問題 | 封面改用分類色＋線條圖示的插畫式封面，不需要下載圖片 |
| 「各工作坊報名佔比」若用甜甜圈圖，難以比較各項大小 | 改用排序後的單色橫向長條圖；兩張圖都是單一數列，不需要圖例，並附表格檢視 |
| 剛載入的 SSR 頁面在 hydration 完成前，按鈕還沒有事件 | E2E 測試等 Header 的登入狀態出現後才互動。這是 SSR 的一般取捨，記錄在此 |

### 實際執行結果
| 檢查 | 結果 |
| --- | --- |
| `npm run lint`／`format:check`／`typecheck` | 0 錯誤／通過／通過 |
| `npm test` | 10 個檔案、211 個測試通過 |
| `npm run test:e2e` | 36 個通過、8 個略過（API 安全測試只在桌機跑一次） |
| API 手動測試（本機正式版建置） | 竄改價格被忽略、名額不足 409、跨帳號存取 404、缺 Origin 403、表單格式 415、登入類第 11 次起 429 |
| Prerender 產出 | `/about`、`/faq`、`/for-organizers`、`/instructors`、`/journal` 與 4 篇文章、`/dev/styleguide` |
| 手機 390px／桌機 1440px 截圖 | 修正後所有檢查頁面無水平捲軸 |
| Chart.js | 獨立 chunk（161 KB 未壓縮），只有 Studio 載入 |

### 尚未處理
- 本機 node 預覽環境下，首頁 `/_payload.json` 預載回 404：node preset 不支援 ISR 規則；Vercel preset 的產出有對應的 ISR 函式，需部署後確認（Phase 7）。
- 結構化資料（JSON-LD）、sitemap.xml、robots.txt、llms.txt（Phase 5）。
- Lighthouse 與無障礙稽核、CSP 實測、`npm audit`（Phase 6）。

### Phase 4 追加調整（依求職者回饋）
| 項目 | 做法 |
| --- | --- |
| 站內照片 | Unsplash、Pexels 擋自動下載（401／403），改用 Openverse API，只篩選 CC0／公眾領域圖片。每個分類搜尋多組關鍵字並拼成縮圖總表，逐張人工檢視後挑選 24 張，裁成 16:10，輸出 640／1280 兩種寬度的 WebP（共 3.3 MB，卡片只載入 640 版本）。來源記錄在 `shared/data/workshop-images.ts` 並列在「關於」頁；單元測試檢查每堂工作坊都有圖片與替代文字。Studio 自建的工作坊沒有照片時，仍使用插畫封面 |
| 回到頂部按鈕 | 捲動超過 1.5 個畫面高度才出現；尊重減少動態設定；鍵盤操作時焦點移回頁首；手機詳細頁會避開底部預約列，Toast 也往上移以免重疊 |
| 列表頁版面 | 結果數量移到結果區右上角（保留 `role="status"`，篩選後會被朗讀）；排序標籤與選單同一列（`BaseSelect` 新增 `inline`） |
| Console 錯誤 `A listener indicated an asynchronous response…` | 這是瀏覽器擴充功能的訊息傳遞錯誤，專案程式碼沒有使用 `chrome.runtime`；以沒有擴充功能的 Playwright 瀏覽器開啟 Studio，沒有出現此錯誤 |
| **本機每頁出現 `/_payload.json` 404** | node 環境不支援 ISR 規則，但前端仍依規則預載 payload。改為 Vercel 上用 ISR、其他環境用 SWR；並明確加上 `/_payload.json` 規則（Nuxt 只會為 ISR 自動補上）。修正後桌機與手機所有檢查頁面 console 0 錯誤；Vercel preset 建置仍產生 6 個 ISR 設定 |

---

## Phase 5 — SEO／GEO（2026-11-19）

依求職者要求：**實作完整的 SEO 技術，但整站預設不被索引**，避免虛構資料被無關的人搜尋到。細節見 [11-seo-geo.md](11-seo-geo.md)。

### 做了什麼
- 全站索引開關 `NUXT_PUBLIC_INDEXABLE`（預設關閉）：所有回應帶 `X-Robots-Tag: noindex`、每頁 robots meta 為 noindex、robots.txt 封鎖 AI 訓練爬蟲。
- `usePageSeo()`：title、description、canonical（不含 query）、Open Graph、Twitter Card；工作坊頁使用課程照片當分享圖，其他頁使用新做的 1200×630 預設圖。
- `useJsonLd()` + 結構化資料產生器：WebSite／Organization、ItemList、CollectionPage、Course + CourseInstance、AggregateRating、Review、FAQPage、ProfilePage、Blog、Article、AboutPage、BreadcrumbList。
- `/robots.txt`、`/sitemap.xml`（57 個網址，由資料產生）、`/llms.txt`；移除 Nuxt 範本內建的靜態 robots.txt。

### 決策
| 問題 | 處理 |
| --- | --- |
| 怎麼「確實」不被索引 | 不用 `Disallow: /`：robots.txt 只擋爬取不擋索引，被擋的爬蟲讀不到 noindex。改為允許爬取 + 標頭與 meta 雙重 noindex |
| AI 爬蟲不一定遵守 noindex | 不開放時在 robots.txt 個別封鎖 GPTBot、ClaudeBot、CCBot、Google-Extended、PerplexityBot、Bytespider |
| 結構化資料描述虛構課程 | 這正是預設不開放索引的理由之一；結構化資料作為技術展示，換成真實資料後才開放 |
| JSON-LD 內容含使用者可見文字 | 序列化時跳脫 `<`，避免 `</script>` 注入 |
| 麵包屑與 BreadcrumbList 可能不一致 | 由麵包屑元件同時輸出畫面與 JSON-LD |

### 實際執行結果
| 檢查 | 結果 |
| --- | --- |
| lint／型別檢查 | 0 錯誤／通過 |
| `npm test` | 12 個檔案、218 個測試通過 |
| `npm run test:e2e` | 42 個通過、14 個略過（API 安全與 SEO 測試只在桌機跑一次） |
| 開放索引模式（`NUXT_PUBLIC_INDEXABLE=true`）手動實測 | 標頭消失；詳細頁 robots 為 `index, follow, max-image-preview:large`；篩選頁 `noindex, follow`；robots.txt 列出 sitemap；`/account` 仍帶 noindex 標頭 |

### E2E 修正
- 手機版測試偶爾在 hydration 完成前就輸入文字。新增 `tests/e2e/support/hydration.ts`，等 Vue app 掛載後才互動。

---

## Phase 6 — 測試與稽核（2026-11-20）

### 實際執行結果
| 檢查 | 工具 | 結果 |
| --- | --- | --- |
| lint／格式／型別檢查 | ESLint、Prettier、vue-tsc | 0 錯誤／通過／通過 |
| 單元測試 | Vitest | 12 個檔案、220 個測試通過 |
| E2E（功能、API 安全、SEO、無障礙、鍵盤） | Playwright | 桌機＋手機共 96 項：78 通過、18 略過（API 安全、SEO、鍵盤測試只在桌機跑） |
| 無障礙自動檢測 | axe-core 4.14，WCAG 2.2 A／AA | 13 個公開頁面、8 個登入後頁面、對話框開啟、表單錯誤狀態：桌機與手機 **0 違規** |
| 鍵盤操作 | Playwright | 選單 Esc 關閉、只用鍵盤完成登入到預約、對話框焦點限制與歸還、分頁方向鍵：全部通過 |
| 依賴弱點 | npm audit | 0 high／critical；2 個 moderate 弱點（報告計為 12 筆，建置與測試工具，不在執行環境，見 05-security.md §8） |
| 機密外洩 | 金絲雀字串建置後搜尋產出 | 0 筆 |
| CSP | 瀏覽器監聽 `securitypolicyviolation` | 移除 `'unsafe-inline'` 後全站 0 違規；插入腳本被阻擋 |

### Lighthouse（行動版模擬，本機，`npm run audit:lighthouse`）
本機 node 預覽伺服器不壓縮動態回應，所以另外以 brotli 代理模擬 CDN 壓縮（`-- --br`），兩種都記錄。Vercel 實際數字於部署後量測（Phase 7）。

| 頁面 | 效能（未壓縮） | 效能（brotli） | LCP（brotli） | 無障礙 | 最佳做法 | SEO |
| --- | --- | --- | --- | --- | --- | --- |
| 首頁 | 83 | 89 | 3.3 s | 100 | 100 | 69* |
| 工作坊列表 | 77 | 84 | 3.7 s | 100 | 100 | 69* |
| 工作坊詳細 | 83 | 90 | 3.1 s | 100 | 100 | 69* |
| 分類頁 | 86 | 92 | 2.9 s | 100 | 100 | 69* |
| 文章 | 97 | 96 | 2.6 s | 100 | 100 | 69* |
| FAQ | 98 | 96 | 2.4 s | 100 | 100 | 66* |

所有頁面 CLS 皆為 0，TBT 0–110 ms。
\* SEO 分數只扣「頁面禁止索引」一項，是刻意設定的 noindex（Phase 5）。

**改善前後（未壓縮）**：第一次量測效能只有 62–78。原因與處理：
| 發現 | 處理 | 效果 |
| --- | --- | --- |
| 每頁 HTML 內嵌 249 KB CSS，其中 234 個 `@font-face`：中文字型被 Google Fonts 切成一百多個字元區段，600 與 700 兩種字重各一套 | 標題只保留 700 一種字重 | 首頁 HTML 287 KB → 177 KB |
| 靜態 JS／CSS 沒有壓縮 | `nitro.compressPublicAssets` 預先產生 gzip／brotli | 靜態資源傳輸量大幅下降 |
| 手機（412px × 1.75 倍）會下載 1280px 照片 | 新增 960px 版本（24 張由 2.45 MB 降為 1.44 MB） | 卡片與詳細頁主圖改用 960 |
| 列表頁、分類頁的 LCP 是第一張卡片照片，卻設定延遲載入 | 第一張卡片 `loading="eager"`、`fetchpriority="high"` | LCP 提早開始下載 |
| CSP 違規讓最佳做法只有 96：Zod 嘗試 `new Function` | Zod `jitless: true` | 最佳做法 100 |

**未達 90 的頁面**：首頁（89）與列表頁（84）。主要成本是約 117 KB 的中文字型宣告（壓縮後仍佔 HTML 的大部分）與列表首屏 12 張照片。後續改善方向：以建置腳本裁切標題字型的字元子集並自行託管，取代 Google Fonts 的區段切割。

### 測試中發現並修正的問題
| 問題 | 處理 |
| --- | --- |
| 測試以 `toHaveURL(/\/account$/)` 判斷登入成功，但登入頁網址 `/login?redirect=/account` 也符合，**4 個測試其實沒有驗證到登入** | 改為比對 `pathname`；axe 測試因此才真正檢測到登入後的頁面 |
| 原生 `<dialog>` 中連按 Tab，焦點會離開到瀏覽器介面，測試誤判為「焦點跑出對話框」 | 這是 `showModal()` 的標準行為（背景為 inert）；測試改為驗證焦點絕不落在背景頁面元素上 |
| Lighthouse 腳本用 `spawnSync`，凍結事件迴圈，同程序內的壓縮代理無法回應而卡死 | 改為非同步 `spawn` |
| CSP 仍允許 `images.unsplash.com` | 照片已改為站內存放，移除外部圖片網域 |

### 人工檢查（自動化測不到的部分）
- 螢幕閱讀器（NVDA／VoiceOver）的實際朗讀體驗尚未人工測試；元件已依 WAI-ARIA 模式實作（tabs、dialog、disclosure、live region），列為部署後的人工檢查項目。

## Phase 7 — 作品展示與部署準備（2026-11-20）

### 做了什麼
- 推上 GitHub（`Ivan5788/atelio`），commit 作者使用 GitHub noreply 信箱。
- `README.md`：專案介紹、截圖、技術亮點、品質指標、本機執行方式、文件索引。
- `scripts/screenshots.mjs`：以 Playwright 對正式版建置產生 README 截圖（桌機 1440×900、手機 Pixel 7），可重複執行。
- [12-deployment.md](12-deployment.md)：Vercel、Upstash 設定步驟與上線後檢查清單。
- 更正 npm audit 評估：原本寫「全部來自 minimatch」，重新檢查後實際是 `minimatch` 與 `glob` 兩個弱點（[05-security.md](05-security.md) §8）。

### 問題與決策
| 問題 | 處理 |
| --- | --- |
| 透過 Vercel Marketplace 連接 Upstash 時，注入的變數名稱是 `KV_REST_API_URL`／`KV_REST_API_TOKEN`；原本的程式只讀 `UPSTASH_REDIS_REST_*`，而且是在**建置時**決定要不要用 Redis。部署後會靜默退回記憶體儲存（Serverless 上每個請求的資料都可能消失） | 新增 `server/utils/redis-env.ts` 同時接受兩組名稱；`server/plugins/storage.ts` 在**執行時**把 `data` 儲存區換成 Redis。修改環境變數不必為了這兩個值重新建置，金鑰也不會被寫進建置產出 |

### 實際執行結果
| 檢查 | 結果 |
| --- | --- |
| `npm run lint`、`npm run typecheck` | 通過 |
| `npm test` | 12 個檔案、220 個測試通過 |
| 以假的 `KV_REST_API_*` 值建置後搜尋 `.output` | 0 筆（金鑰未進入建置產出） |
| 正式版建置啟動時不給 Redis 變數 | `/api/health` 回 `storage: memory`、`status: ok` |
| 同一份建置，啟動時給假的 `KV_REST_API_*` | `/api/health` 回 `storage: upstash`、`status: degraded`（確實改連 Redis；主機是假的所以連線失敗，符合預期） |

### 部署（2026-11-21，Vercel Hobby ＋ Upstash Redis Tokyo）
| 問題 | 處理 |
| --- | --- |
| 第一次部署後登入回 500（`appSecret` is not set）、健康檢查回 `storage: memory` | 專案還沒有任何環境變數。補上 `NUXT_APP_SECRET`（Production、Preview 各一組）並連接 Upstash（前綴填 `KV`，產生 `KV_REST_API_*`） |
| 設定後仍無效 | 重新部署到的是 Dependabot PR 的 Preview 部署，Production 沒有重新部署 |
| Vercel 的 commit 編號與 GitHub repo 對不上 | 匯入時 Vercel 另外建立了 `atelio-by-v` repo（壓成一個 Initial commit）。改連回 `Ivan5788/atelio`，之後 push 到 `main` 才會自動部署 |

### 上線後檢查（`reports/check-live.mjs`，Playwright 對正式網址）
| 檢查 | 結果 |
| --- | --- |
| `/api/health` | `status: ok`、`storage: upstash` |
| 8 個公開頁面（兩輪） | 全部 200、完成 hydration；第二輪 ISR 頁面為 `X-Vercel-Cache: HIT` |
| ISR 快取頁面的 CSP | 兩輪皆 0 違規，CDN 快取的 HTML 與 hash 一致（這項本機無法驗證） |
| 安全標頭 | CSP（`script-src` 無 `unsafe-inline`）、HSTS、X-Content-Type-Options、Referrer-Policy、Permissions-Policy、COOP／CORP、`X-Robots-Tag: noindex, nofollow` |
| Demo 登入 | 成功，`/api/me` 連續 5 次 200 |
| 寫入後讀回 | 收藏寫入後連續 8 次請求都讀得到（不同 Serverless 實例共用 Redis） |
| 預約流程 | 完成預約，重新整理後在「我的預約」中仍存在 |
| Console | 0 個錯誤 |

### 首次載入偏慢（2026-11-21）
實測（從台灣，`curl`）：沒有被 CDN 快取的請求都經過 `hkg1::iad1`，也就是香港邊緣節點轉送到美國東部執行。
| 請求 | TTFB |
| --- | --- |
| CDN 快取命中（HIT） | 70–100 ms |
| 詳細頁快取未命中（部署後第一次） | 約 1,000 ms |
| `/workshops`（依網址參數篩選，不快取） | 350–730 ms |
| `/api/health`（每次都連 Redis） | 約 460 ms |

原因：Vercel Functions 預設在 `iad1`（美國東部），Upstash 卻在東京，每個沒快取的請求都要台灣→美國，登入後的 API 還要再美國→東京。處理：`vercel.json` 設定 `regions: ["hnd1"]`，讓 Functions 與 Redis 都在東京。
