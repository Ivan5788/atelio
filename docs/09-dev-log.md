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
