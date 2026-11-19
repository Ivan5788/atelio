# Atelio API 文件

> 版本：v0.4（Phase 4）・所有端點位於 `server/api/`，由 Nitro 部署為 Vercel Functions。
> 型別定義：`shared/types/domain.ts`；驗證 schema：`shared/schemas/index.ts`（前後端共用）。

## 共通規則

| 項目 | 規則 |
| --- | --- |
| 格式 | 請求與回應皆為 JSON。會改變資料的請求必須帶 `Content-Type: application/json`，否則回 415 |
| 來源檢查 | POST／PUT／PATCH／DELETE 必須帶與站台相同的 `Origin`，否則回 403（CSRF 防護） |
| 大小上限 | 請求 body 上限 100 KB，超過回 413 |
| 速率限制 | 登入／註冊／Demo：每 IP 每 10 分鐘 10 次；其他：每 IP 每分鐘 60 次。超過回 429 並附 `Retry-After` |
| 快取 | `/api/**` 一律 `Cache-Control: no-store`、`X-Robots-Tag: noindex` |
| 登入 | 加密的 `httpOnly` Session Cookie（`nuxt-auth-session`），72 小時到期 |

### 錯誤格式

```json
{
  "statusCode": 400,
  "message": "輸入資料有誤，請檢查後再試一次",
  "data": { "fieldErrors": { "contact.phone": "請輸入 09 開頭的 10 碼手機號碼" } }
}
```

| 狀態碼 | 意義 |
| --- | --- |
| 400 | 驗證失敗，`data.fieldErrors` 為「欄位路徑 → 第一則錯誤訊息」 |
| 401 | 未登入，或示範帳號已過 72 小時被刪除 |
| 404 | 資源不存在，**或不屬於目前使用者**（不透露資源是否存在） |
| 409 | 業務規則衝突：名額不足（`data.reason = "insufficient-seats"`、`data.seatsLeft`）、Email 已註冊、開課前 72 小時內無法修改 |

## 公開端點（不需登入）

| Method | Endpoint | 說明 |
| --- | --- | --- |
| GET | `/api/workshops` | 列表。query：`q`、`category`（逗號分隔多選）、`city`、`level`（逗號分隔）、`priceMin`、`priceMax`、`dateFrom`（YYYY-MM-DD）、`sort`（`upcoming`／`newest`／`price-asc`／`price-desc`／`rating`）、`page`、`pageSize`（≤ 50）。回傳 `Paginated<WorkshopSummary>` |
| GET | `/api/workshops/:slug` | `{ workshop, related }`。**刻意不讀取 Session**，因為詳細頁會被 ISR 快取 |
| GET | `/api/workshops/:slug/sessions` | 場次與剩餘名額；已登入時會扣除自己的預約。只在瀏覽器端呼叫 |
| GET | `/api/categories`、`/api/cities` | 含落地頁介紹文字與工作坊數量 |
| GET | `/api/instructors`、`/api/instructors/:slug` | 講師；單一講師回傳 `{ instructor, workshops }` |
| GET | `/api/articles`、`/api/articles/:slug` | 文章；單篇回傳 `{ article, related }` |
| GET | `/api/search?q=` | `{ workshops, instructors, articles }`，各最多 6 筆 |
| GET | `/api/health` | 健康檢查，只回傳狀態與儲存類型 |

## 帳號

| Method | Endpoint | 說明 |
| --- | --- | --- |
| POST | `/api/auth/demo` | 建立新的獨立示範帳號並登入（預先放入兩筆預約與兩筆收藏） |
| POST | `/api/auth/register` | `{ name, email, password, confirmPassword }` → 201。Email 已註冊回 409 |
| POST | `/api/auth/login` | `{ email, password }`。失敗一律回 401「Email 或密碼錯誤」，不透露帳號是否存在 |
| POST | `/api/auth/logout` | 清除 Session |
| GET | `/api/me` | 目前使用者（`PublicUser`，不含密碼雜湊） |
| PATCH | `/api/me` | 更新 `{ name, phone, interests }` |

## 我的預約與收藏（需登入）

| Method | Endpoint | 說明 |
| --- | --- | --- |
| GET | `/api/me/bookings` | 依開課時間排序 |
| POST | `/api/me/bookings` | `{ workshopSlug, sessionId, quantity, contact }` → 201。**沒有價格欄位**，金額由伺服器計算；名額不足回 409 |
| GET | `/api/me/bookings/:id` | 單筆預約（預約完成頁使用） |
| PATCH | `/api/me/bookings/:id` | `{ quantity }`，重新計算金額 |
| DELETE | `/api/me/bookings/:id` | 取消（軟刪除，狀態改為 `cancelled`）。開課前 72 小時內回 409 |
| GET | `/api/me/favorites` | 收藏的工作坊（`WorkshopSummary[]`） |
| GET | `/api/me/favorites/ids` | 只回傳 slug，用於卡片愛心狀態 |
| PUT／DELETE | `/api/me/favorites/:slug` | 加入／移除收藏（冪等） |

## Studio（需登入）

| Method | Endpoint | 說明 |
| --- | --- | --- |
| GET | `/api/studio/workshops` | query：`q`、`status`（`all`／`published`／`draft`）、`sort`（`updated`／`title`／`price`／`booked`）、`page`、`pageSize` |
| POST | `/api/studio/workshops` | 新增 → 201 |
| GET | `/api/studio/workshops/:id` | 單筆（編輯表單使用） |
| PUT | `/api/studio/workshops/:id` | 完整更新（表單送出整份資料） |
| PATCH | `/api/studio/workshops/:id` | `{ status }`，上架／下架 |
| DELETE | `/api/studio/workshops/:id` | 刪除 → 204 |
| GET | `/api/studio/stats` | KPI、近 6 個月報名趨勢、各工作坊報名佔比（示範數字） |

## 資料隔離與名額計算

- 每個帳號的資料存在 `user:{id}:*`，72 小時後與帳號一起過期。查詢預約時只在自己的清單中尋找，所以拿別人的預約 id 只會得到 404（IDOR 防護）。
- 剩餘名額 = 每場次容量 − 示範報名人數（由場次 id 雜湊產生，固定不變）− **目前使用者自己的預約**。不加總所有訪客的預約，避免示範網站隨訪客增加慢慢全部額滿。
- Studio 第一次進入時複製一份示範開課者的工作坊，之後只修改自己的副本，不影響公開頁面與其他訪客。
