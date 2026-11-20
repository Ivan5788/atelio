# 部署與上線檢查

> Phase 7・部署目標：Vercel Hobby（免費方案）＋ Upstash Redis（透過 Vercel Marketplace）。
> 以下步驟都在你自己的 Vercel／GitHub 帳號操作，金鑰只存在 Vercel 的環境變數中，不進 repo。

---

## 1. 建立 Vercel 專案

1. Vercel 首頁 → **Add New… → Project** → 選擇 GitHub repo `atelio` → **Import**。
2. Framework Preset 會自動偵測為 **Nuxt.js**，Build Command、Output Directory 保持預設。
3. 先**不要**按 Deploy，展開 **Environment Variables** 完成第 2 步（或先部署，設定完再 Redeploy 也可以）。

### Node.js 版本
專案需要 Node 22.22.3 以上。到 **Settings → Build and Deployment → Node.js Version** 選 **24.x**，與 `.node-version`、CI 一致。

---

## 2. 環境變數

| 名稱 | 值 | 環境 |
| --- | --- | --- |
| `NUXT_APP_SECRET` | 32 bytes 以上的隨機字串（產生方式見下方） | Production、Preview **各產生一組不同的值** |
| `KV_REST_API_URL`、`KV_REST_API_TOKEN` | 第 3 步連接 Upstash 後**自動注入**，不用手動填 | — |
| `NUXT_PUBLIC_SITE_URL` | 可不填：程式會自動使用 Vercel 提供的正式網域。改用自訂網域時才需要 | Production |
| `NUXT_PUBLIC_INDEXABLE` | **不要設定**。本站是虛構資料，保持 noindex | — |

產生 `NUXT_APP_SECRET`（任一種即可）：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# 或（macOS／Linux／Git Bash）
openssl rand -base64 32
```

- 少了 `NUXT_APP_SECRET`，登入會失敗（正式建置不會自動產生）。
- 這個值等於 Session 的加密金鑰：**不要**貼到聊天、截圖或 commit 裡。若外洩，直接換一組新的並 Redeploy，所有人會被登出，但不會有其他影響。

---

## 3. 連接 Upstash Redis

1. Vercel 專案頁 → **Storage** → **Create Database** → 選 **Upstash for Redis**（Marketplace）。
2. 方案選 **Free**；區域建議選 **Tokyo（ap-northeast-1）**，離台灣使用者近。
3. 建立後 **Connect Project** 連到 `atelio`，勾選 Production 與 Preview。Vercel 會自動加入 `KV_REST_API_URL`、`KV_REST_API_TOKEN` 等變數。
4. 程式同時接受 `UPSTASH_REDIS_REST_*` 與 `KV_REST_API_*` 兩組名稱（`server/utils/redis-env.ts`），並在**執行時**讀取，所以不需要改名，也不會被寫進建置產出。

### Functions 區域（建議）
**Settings → Functions → Function Region** 改成與 Upstash 相同的區域（Tokyo, `hnd1`）。每個 API 請求都會連 Redis，兩者在同一區域可以減少延遲。

---

## 4. 部署

- 設定完成後到 **Deployments** → 最新一筆 → **Redeploy**（環境變數只對之後的部署生效）。
- 之後每次 push 到 `main` 會自動部署到 Production；開 PR 會產生 Preview 網址。
- **Deployment Protection**：Hobby 方案預設以 Vercel Authentication 保護 Preview 部署，保持開啟即可（Production 公開）。

---

## 5. 上線後檢查

把 `<網址>` 換成 Vercel 給的正式網址。

### 功能
- [ ] 開啟 `<網址>/api/health`，應回傳 `"status": "ok"`、`"storage": "upstash"`。若是 `memory`，代表 Redis 變數沒有注入到這次部署，Redeploy 一次。
- [ ] 一鍵 Demo 登入 → 預約一堂課 → 會員中心看得到預約。
- [ ] Studio 新增一個工作坊，重新整理後仍然存在（確認資料真的寫進 Redis）。

### 標頭與索引
```bash
curl -sI <網址>/ | grep -iE "content-security|x-robots|strict-transport|x-frame|referrer|permissions"
curl -s <網址>/robots.txt
```
- [ ] 每個回應都有 `X-Robots-Tag: noindex, nofollow`。
- [ ] `robots.txt` 只擋私人頁面與 AI 爬蟲（`GPTBot` 等為 `Disallow: /`），沒有列出 sitemap。一般搜尋引擎刻意不擋：要讓它們爬到頁面、讀到 noindex，網址才不會出現在搜尋結果（理由見 `server/routes/robots.txt.ts`）。
- [ ] CSP 的 `script-src` 沒有 `'unsafe-inline'`。

### ISR 頁面的 CSP（只能在 Vercel 上確認）
- [ ] 開啟任一工作坊詳細頁 → 開發者工具 Console 沒有 CSP 違規 → 重新整理一次（這次是 CDN 快取的版本），仍然沒有違規。

### 評分（需要公開網址）
- [ ] [securityheaders.com](https://securityheaders.com/)
- [ ] [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory)
- [ ] [PageSpeed Insights](https://pagespeed.web.dev/)（行動版）

結果記錄到 [09-dev-log.md](09-dev-log.md)，並把 README 的「線上展示」換成正式網址。

---

## 6. GitHub repo 設定

- [ ] **Settings → Code security**：開啟 Secret scanning、Push protection、Dependabot alerts（公開 repo 免費）。
- [ ] 確認 **Actions** 分頁的 CI 通過（lint、型別檢查、單元測試、npm audit、E2E）。
- [ ] repo 的 About 填入說明、網址與 Topics。

---

## 7. 費用與限制（Hobby／Free 方案）

| 項目 | 注意事項 |
| --- | --- |
| Vercel Hobby | 僅限非商業用途，作品集符合。Functions 與頻寬有每月額度，示範網站的流量遠低於上限 |
| Upstash Free | 每月指令數有上限。速率限制只套用在會寫入 Redis 的端點，一般瀏覽不消耗額度 |
| 資料保存 | 使用者資料 72 小時自動過期，資料庫不會持續成長 |
