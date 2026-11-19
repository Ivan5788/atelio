# Atelio 資安規劃

> 版本：v0.1・最後更新：2026-11-19
> 角色：Security Engineer（威脅建模、控制措施）＋ Frontend Technical Lead（落實於程式與流程）
> 原則：**只寫做得到、可以驗證的措施。** 每項控制措施都會對應到程式位置或測試，在「驗證方式」欄記錄。

---

## 1. 先講清楚：能保護什麼、不能保護什麼

| 問題 | 事實 | 本專案的做法 |
| --- | --- | --- |
| 前端程式碼會被看到嗎？ | **一定會。** 瀏覽器必須下載 JS/CSS 才能執行，任何人都能在 DevTools 看到。混淆（obfuscation）只會增加閱讀難度，無法防止複製。 | 不把任何機密或商業邏輯放在前端。「防竊取」的重點是保護**機密與資料**，不是隱藏前端程式碼。 |
| GitHub 原始碼會被抄嗎？ | 公開 repo 可以被任何人瀏覽與 fork。面試官通常需要看原始碼，所以建議公開。 | 不附開源授權（預設為著作權保留）、README 註明「僅供求職展示，禁止重製」；完整的 commit 歷史本身就是「這是我做的」最好的證明。 |
| 機密會外洩嗎？ | 最常見的外洩方式是把 `.env` 或 API Key commit 進 Git。 | 見 §4 機密管理，多層防護。 |
| 網站會被攻擊嗎？ | 公開網站一定會被自動化掃描。 | 見 §3 控制措施；Vercel 平台內建 DDoS 防護。 |

---

## 2. 威脅模型（簡化 STRIDE）

### 2.1 要保護的資產

1. **機密**：`NUXT_APP_SECRET`（Session 加密金鑰）、Upstash Redis 連線 Token、Vercel／GitHub 帳號。
2. **使用者資料**：示範帳號的 Email、雜湊後的密碼、預約與收藏（雖然是示範資料，仍以真實資料的標準保護）。
3. **服務可用性**：避免免費額度被惡意請求耗盡，導致面試官打不開網站。
4. **網站完整性**：避免頁面被竄改、植入惡意腳本。

### 2.2 威脅與對策

| 類型 | 威脅情境 | 對策 | 參照 |
| --- | --- | --- | --- |
| **S** 偽冒身分 | 偷 Session Cookie、暴力破解密碼 | `httpOnly` + `Secure` + `SameSite=Lax` 加密 Cookie；登入失敗速率限制 | C-01, C-05 |
| **T** 竄改 | 修改請求內容，例如把價格改成 0、把人數改成負數 | 後端以 Zod 驗證所有輸入；**金額由後端計算**，不接受前端傳入的價格 | C-02 |
| **R** 否認 | 無法追查異常操作 | 記錄重要操作（不記錄密碼與完整 Email），使用 Vercel Logs | C-12 |
| **I** 資訊洩漏 | 越權讀取他人預約（IDOR）、錯誤訊息洩漏堆疊資訊、機密進入前端 bundle | 每個資源檢查擁有者；正式環境不回傳 stack trace；機密只放在私有 runtimeConfig | C-03, C-09, C-10 |
| **D** 阻斷服務 | 大量請求耗盡 Vercel／Upstash 免費額度 | 每 IP 速率限制、請求大小上限、分頁上限；Vercel 內建 DDoS 防護 | C-05, C-06 |
| **E** 權限提升 | 一般使用者呼叫 Studio API 修改他人的工作坊 | 伺服器端中介層檢查登入與擁有權，**前端路由守衛只是使用者體驗，不是安全機制** | C-03, C-04 |
| XSS | 在工作坊描述、評價中注入 `<script>` | Vue 預設跳脫輸出；ESLint 禁用 `v-html`；CSP 限制腳本來源 | C-07, C-08 |
| CSRF | 惡意網站誘使已登入使用者送出請求 | `SameSite=Lax` Cookie + 狀態變更請求檢查 `Origin` 標頭 + 只接受 JSON | C-11 |
| 供應鏈 | 惡意或有漏洞的 npm 套件 | Lockfile、`npm ci`、CI 執行 `npm audit`、Dependabot、控制套件數量 | C-13 |

---

## 3. 控制措施清單

| ID | 控制措施 | 實作位置（規劃） | 驗證方式 |
| --- | --- | --- | --- |
| C-01 | 加密 Session Cookie（`nuxt-auth-utils`），72 小時過期 | `server/api/auth/*` | 單元測試 + DevTools 檢查 Cookie 屬性 |
| C-02 | 所有 API 輸入以 Zod 驗證（body、query、route params） | `shared/schemas/*`、各 handler | 單元測試：傳入非法資料應回 400 |
| C-03 | 授權檢查：`requireUserSession` + 資源擁有者比對 | `server/services/*` | E2E：使用者 A 存取 B 的預約應回 404 |
| C-04 | 前端路由守衛（只提升使用者體驗） | `app/middleware/auth.ts` | E2E |
| C-05 | 速率限制：會讀寫資料庫的 API（`/api/me`、`/api/studio`、個人化名額）每 IP 每分鐘 60 次；登入／註冊／Demo 每 IP 每 10 分鐘 10 次。只讀 seed 的公開 API 不限流（不耗資料庫額度，且 SSR 內部呼叫量大，見 middleware 註解） | `server/middleware/02.rate-limit.ts`、`server/utils/rate-limit.ts`（`@upstash/ratelimit`） | 測試腳本連續請求應回 429 |
| C-06 | 請求大小上限（100 KB）、`pageSize` 上限 50、字串長度上限 | `nuxt-security` 設定 + `server/middleware/01.api-guard.ts`（補上 PATCH）+ Zod schema | 單元測試 |
| C-07 | 禁止 `v-html`（ESLint `vue/no-v-html: error`）；文章 Markdown 在建置時轉為 HTML，內容來源只有 repo 本身 | `eslint.config.mjs` | CI lint |
| C-08 | 安全標頭：CSP（SSR 使用 nonce）、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`、`frame-ancestors 'none'`；HSTS 由 Vercel 提供 | `nuxt-security` | securityheaders.com 掃描並存檔結果 |
| C-08a | ⚠️ 待驗證：Prerender／ISR 頁面的 HTML 被 CDN 快取後，nonce 會固定不變，失去 nonce 的意義。這類頁面改用 script hash 型 CSP（`nuxt-security` 的 SSG 模式），Phase 5 實測後記錄最終做法。 | `nuxt.config.ts` | 檢查快取頁面的 CSP header |
| C-09 | 正式環境錯誤回應只包含 `statusCode` 與使用者訊息，不含 stack | `server/utils/error.ts` | 手動測試正式環境 |
| C-10 | 機密只放 `runtimeConfig`（非 public），由環境變數注入 | `nuxt.config.ts` | 建置後搜尋 `.output/public` 不應出現機密字串 |
| C-11 | POST/PATCH/PUT/DELETE 檢查 `Origin` 與站台網域相同；只接受 `application/json` | `server/middleware/01.api-guard.ts` | 單元測試 |
| C-12 | 結構化 log：記錄操作類型、使用者 id、時間；不記錄密碼、Token、完整 Email | `server/utils/logger.ts` | Code review |
| C-13 | 供應鏈：`package-lock.json` 進版控、CI 使用 `npm ci`、`npm audit --audit-level=high`、啟用 Dependabot | `.github/` | CI 結果 |
| C-14 | 密碼規則：至少 8 字元，含英文字母與數字；scrypt 雜湊；登入失敗訊息不透露帳號是否存在 | `shared/schemas/auth.ts` | 單元測試 |
| C-15 | 個資最小化：資料 72 小時 TTL；註冊頁提醒勿使用真實密碼；不蒐集電話以外的個資 | Redis TTL、註冊頁 | 手動確認 Redis TTL |

---

## 4. 機密管理（防止 Key 外洩）

多層防護，任何一層失守還有下一層：

1. **`.gitignore`**：排除 `.env*`（保留 `.env.example`，只放變數名稱、不放值）。
2. **GitHub Secret Scanning + Push Protection**：GitHub 偵測到已知格式的 Token 時會阻擋 push（公開 repo 免費）。
3. **環境變數只設定在 Vercel Dashboard**：分別設定 Production／Preview／Development 三組，Preview 使用不同的 Redis 資料庫，避免開發中的版本碰到正式資料。
4. **命名規則**：只有 `NUXT_PUBLIC_*` 會進入前端 bundle，所以機密**絕不可**使用這個前綴。
5. **外洩應變**：若機密曾經 commit，**刪除 commit 不夠**（已經 push 的歷史可能已被抓取）→ 必須立即到服務端撤銷並重新產生金鑰。

| 環境變數 | 用途 | 是否機密 |
| --- | --- | --- |
| `NUXT_APP_SECRET` | Nuxt appSecret，nuxt-auth-utils 0.6 由它衍生 Session 加密金鑰（`openssl rand -base64 32`） | ✅ |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Redis 連線（Vercel Marketplace 整合會自動注入） | ✅ |
| `NUXT_PUBLIC_SITE_URL` | 正式網址（canonical、sitemap 使用） | ❌ |

---

## 5. Vercel 平台設定檢查表

- [ ] Production 網址公開；Preview 部署開啟 **Deployment Protection**（Vercel Authentication）。
- [ ] 環境變數依 Production／Preview 分開設定。
- [ ] GitHub repo 開啟 Secret Scanning、Push Protection、Dependabot alerts。
- [ ] `main` 分支開啟 branch protection：CI 通過才能合併。
- [ ] Vercel 與 GitHub 帳號開啟兩步驟驗證（2FA）——帳號被盜比程式漏洞更危險。
- [ ] 視需要啟用 Vercel Firewall 的 Attack Challenge Mode（遭受攻擊時）。

---

## 6. 安全測試計畫（Phase 6 執行，結果如實記錄）

| 測試 | 工具 | 預期結果 |
| --- | --- | --- |
| 輸入驗證 | Vitest 呼叫 API handler | 非法輸入回 400，附欄位錯誤 |
| 越權存取 | Playwright（兩個使用者） | 存取他人資源回 404 |
| 速率限制 | 腳本連續請求 | 超過門檻回 429 |
| 安全標頭 | securityheaders.com、Mozilla Observatory | 記錄實際評分 |
| 依賴漏洞 | `npm audit` | 無 high／critical，若有則記錄處理方式 |
| 機密檢查 | 搜尋建置產物 | 前端 bundle 不含任何機密 |

> 本專案**不會**對任何第三方系統進行測試，所有安全測試只針對自己的本機與部署環境。

---

## 7. 面試可說明的重點

1. **「前端驗證不是安全機制」**：路由守衛與表單驗證可以被繞過（直接用 curl 打 API），真正的保護在伺服器端。
2. **為什麼 Session 用 `httpOnly` Cookie 而不是 localStorage**：XSS 可以讀取 localStorage，但讀不到 `httpOnly` Cookie。
3. **IDOR 是什麼、怎麼防**：只檢查「有沒有登入」不夠，還要檢查「這筆資料是不是你的」。
4. **為什麼金額由後端計算**：前端送來的任何數字都可能被竄改。
5. **為什麼 ISR 快取不能包含使用者資料**：CDN 快取是所有人共用的，會把 A 的資料顯示給 B。

---

## 8. Phase 6 實測結果（2026-11-20，本機正式版建置）

| ID | 控制措施 | 實測方式 | 結果 |
| --- | --- | --- | --- |
| C-01 | Session Cookie 屬性 | E2E 讀取 `Set-Cookie` | `HttpOnly`、`Secure`、`SameSite=Lax` ✅ |
| C-02 | 輸入驗證 | E2E 直接打 API | 非法參數回 400 並附欄位錯誤 ✅ |
| C-03 | 越權存取（IDOR） | E2E 兩個帳號互相讀取／修改／取消預約 | 一律 404，原預約不受影響 ✅ |
| C-05 | 速率限制 | 腳本連續登入 | 第 11 次起回 429，附 `Retry-After: 600` ✅ |
| C-06 | 請求大小 | 程式檢查（`01.api-guard.ts`） | 超過 100 KB 回 413（含 PATCH）✅ |
| C-08 | CSP | E2E 檢查標頭＋在頁面插入內嵌腳本 | `script-src` **沒有** `'unsafe-inline'`、`'unsafe-eval'`；插入的腳本未執行並觸發違規事件 ✅ |
| C-08a | 快取頁面的 CSP | 檢查 SSR／ISR 與預先產生頁面的標頭 | 全站改用 hash：預先產生頁面由 nuxt-security 計算，SSR／ISR 頁面由 `server/plugins/csp-ssr-hashes.ts` 計算。所有頁面（含登入後的會員中心與 Studio）CSP 違規 0 件 ✅ |
| C-10 | 機密不進前端 | 以假的「金絲雀」機密建置後搜尋 `.output` | 前端與伺服器產出皆 0 筆 ✅ |
| C-11 | Origin／Content-Type | E2E | 缺少或外站 Origin 回 403；表單格式回 415 ✅ |
| C-13 | 依賴弱點 | `npm audit` | 0 high／critical；12 moderate，見下方說明 |
| C-14 | 登入失敗訊息 | E2E 比較錯誤密碼與不存在的帳號 | 狀態碼與訊息完全相同 ✅ |

### CSP 的取捨（更新）
- **script-src**：已移除 `'unsafe-inline'`。nonce 不適合 ISR（CDN 快取後所有人拿到同一個 nonce），所以 SSR 頁面也改用 hash：頁面上會執行的內嵌腳本只有 Nuxt 的設定與 importmap，內容在同一次部署中固定，hash 與快取的 HTML 永遠一致。
- **style-src**：仍允許 `'unsafe-inline'`。Nuxt 會內嵌元件 CSS，Vue 的 `:style` 綁定也會產生 style 屬性。樣式注入無法執行程式，風險明顯低於腳本注入。
- **Zod**：設定 `jitless: true`。Zod 4 預設會嘗試用 `new Function` 加速驗證，被 CSP 擋下後才退回，每頁都留下一則違規紀錄（Lighthouse 最佳做法因此只有 96 分）。

### npm audit：12 個 moderate
全部來自同一個問題：`minimatch` 的 ReDoS（GHSA-g3hv-75wg-m249，修正版 11.0.1），經由 `nitropack → archiver → readdir-glob` 與測試工具 `@vue/test-utils → js-beautify → editorconfig` 引入。
- **不在執行環境中**：正式執行的 `.output/server` 內沒有這些套件（實際檢查 39 個打包套件）。
- **無法被利用**：它們只在建置與測試時處理專案自己的 glob 設定，不接觸使用者輸入。
- **處理方式**：`npm audit fix --force` 會降版測試工具（破壞性變更），因此不執行；CI 以 `--audit-level=high` 把關，並新增 `.github/dependabot.yml` 追蹤 Nuxt 上游更新。

### 尚待部署後確認（Phase 7）
- securityheaders.com、Mozilla Observatory 的評分（需要公開網址）。
- Vercel 上 ISR 頁面的 CSP hash 與快取 HTML 是否一致（本機以 node preset 驗證，Vercel preset 的建置產出已確認 ISR 設定）。
