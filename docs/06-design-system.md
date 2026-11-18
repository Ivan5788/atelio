# Atelio Design System

> 版本：v0.1（Phase 2）・最後更新：2026-11-19
> 本文件定義設計語言與 Token。高保真設計稿分三個層次交付：
> 1. **視覺設計稿（初稿）**：Design System 規範頁＋首頁、列表、詳細頁的 Desktop／Mobile 版，用於確認視覺方向。
> 2. **Figma 設計檔**：視覺方向確認後，以設計稿為基礎在 Figma 建立元件（Components／Variants）、Variables（色彩、間距 Token）與 Auto Layout 版面，作為求職作品集的設計交付物。
> 3. **`/dev/styleguide` 頁面**（Phase 3）：Token 實作成 SCSS 後的「活的設計規範」，確認程式與設計稿一致。

---

## 1. 設計概念：「工坊手記」

### 1.1 方向
Atelio 的使用者要找的是**親手做東西的體驗**，所以介面不該像冷冰冰的 SaaS 後台，也不該是常見的「漸層紫藍 + 大圓角卡片 + emoji」AI 模板風。

設計概念取自**工坊裡的紙本物件**：課程簡章、手寫標籤、入場票根、釉色色票。

| 關鍵字 | 在介面上的表現 |
| --- | --- |
| 紙張 | 暖米色背景（不是純白），細線分隔取代大量陰影 |
| 編輯排版 | 標題用襯線字體，版面有明確的欄線與留白，像雜誌而非模板 |
| 票根 | 工作坊卡片右側為「票根」區塊：日期、剩餘名額，以等寬字體呈現，像印刷的入場券 |
| 釉色色票 | 每個分類有一個低彩度代表色（陶土橘、苔綠、靛藍…），用於標籤與插圖，而非大面積填色 |

### 1.2 設計原則
1. **內容優先**：照片與課程資訊是主角，裝飾元素克制使用。
2. **資訊層級清楚**：使用者在列表上 3 秒內要能判斷「什麼課、在哪、何時、多少錢、還有沒有位子」。
3. **一致勝過花俏**：同一種狀態（loading、錯誤、成功）在全站長得一樣。
4. **可及性是基本要求**：所有文字對比度符合 WCAG 2.2 AA，互動元件可用鍵盤操作。

---

## 2. 色彩

### 2.1 色票

| Token | 色碼 | 用途 |
| --- | --- | --- |
| `--color-paper` | `#F6F1E9` | 頁面背景 |
| `--color-surface` | `#FFFDF9` | 卡片、表單、Modal 背景 |
| `--color-surface-sunken` | `#EFE8DC` | 次要區塊、表格表頭、Skeleton 底色 |
| `--color-ink` | `#1F1B16` | 主要文字、標題 |
| `--color-ink-muted` | `#5E554B` | 次要文字、說明 |
| `--color-ink-subtle` | `#7A7064` | 輔助資訊（placeholder、時間戳記） |
| `--color-line` | `#E3DACB` | 分隔線、卡片邊框（裝飾性） |
| `--color-line-strong` | `#9C9184` | 表單元件邊框（需達 3:1） |
| `--color-clay-600` | `#B4532A` | **品牌主色**：主要按鈕、重點連結 |
| `--color-clay-700` | `#9A4220` | 主色 hover、淺底上的主色文字 |
| `--color-clay-100` | `#F6E2D6` | 主色淺底（選取狀態、標籤底色） |
| `--color-moss-700` | `#3F5B4A` | 次要品牌色：Studio 後台強調、次要按鈕 |
| `--color-success` | `#2E6B47` | 成功 |
| `--color-warning` | `#8A520A` | 警告（文字用深色版本以符合對比） |
| `--color-danger` | `#B3261E` | 錯誤、刪除 |
| `--color-info` / `--color-focus` | `#2F4A6D` | 資訊提示、**鍵盤焦點框** |

### 2.2 對比度驗證（實際計算結果）

以 WCAG 相對亮度公式計算（腳本保留於開發紀錄），一般文字需 ≥ 4.5、大字與 UI 邊框需 ≥ 3。

| 組合 | 對比 | 結果 |
| --- | --- | --- |
| ink / paper | 15.23 | ✅ AAA |
| ink-muted / paper | 6.49 | ✅ AA |
| ink-subtle / surface | 4.77 | ✅ AA |
| 白字 / clay-600（主要按鈕） | 4.99 | ✅ AA |
| clay-700 / paper（連結文字） | 5.88 | ✅ AA |
| 白字 / moss-700 | 7.48 | ✅ AAA |
| danger / surface | 6.43 | ✅ AA |
| warning / surface | 6.28 | ✅ AA |
| line-strong / surface（輸入框邊框） | 3.04 | ✅ UI 3:1 |
| focus / paper（焦點框） | 8.05 | ✅ |

> 注意：`clay-600` 直接放在 paper 背景上當**文字**只有 4.43，未達 AA，所以淺底上的主色文字一律使用 `clay-700`。這是實際計算後才發現的問題，也是「設計要驗證、不能只憑感覺」的例子。

### 2.3 分類代表色（釉色色票）

僅用於分類標籤的小色塊與插圖，**不作為文字色**，因此不需要達到文字對比標準；標籤文字仍使用 ink。

| 分類 | 色碼 | 名稱 |
| --- | --- | --- |
| ceramics 陶藝 | `#B4532A` | 陶土 |
| leathercraft 皮革 | `#8B5E3C` | 鞣革 |
| floral 花藝 | `#B5677A` | 乾燥玫瑰 |
| printmaking 版畫 | `#2F4A6D` | 普魯士藍 |
| typography 字體 | `#1F1B16` | 墨 |
| woodworking 木工 | `#9C7A3C` | 檜木 |
| textile 織品 | `#4E6E8E` | 藍染 |
| illustration 插畫 | `#5F7F5A` | 青苔 |

### 2.4 深色模式（P2，Token 先預留）

| Token | 淺色 | 深色 |
| --- | --- | --- |
| paper | `#F6F1E9` | `#171411` |
| ink | `#1F1B16` | `#F2ECE3`（15.62） |
| ink-muted | `#5E554B` | `#B5AB9E`（8.11） |
| 主色 | `#B4532A` | `#E08A62`（6.97，按鈕文字改用深色） |

---

## 3. 字體

### 3.1 字體家族

| 角色 | 字體 | 理由 |
| --- | --- | --- |
| 標題 Display | **Noto Serif TC**（600 / 700） | 襯線體帶出「簡章、雜誌」的編輯感，也與一般 SaaS 的無襯線風格區隔。 |
| 內文 Body | 系統字體：`"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", system-ui, sans-serif` | 中文字型檔很大（完整字集數 MB），內文使用系統字體可以**零下載**，對 LCP 最有利。 |
| 資料 Mono | **IBM Plex Mono**（500） | 日期、價格、名額、票號——模仿印刷票券，也讓數字等寬、表格對齊。 |

**效能做法**：標題字體以 `@nuxt/fonts` 自動下載並自行託管（不連到 Google，CSP 也較單純），Google 對中文字型提供 `unicode-range` 切片，瀏覽器只下載頁面用到的字；並設定 `font-display: swap` 與 fallback 字體的尺寸校正，降低 CLS。

### 3.2 字級（Type Scale）

以 16px 為基準、比例約 1.25，大標題在手機上自動縮小（`clamp()`）。

| Token | 桌機 | 手機 | 行高 | 用途 |
| --- | --- | --- | --- | --- |
| `display` | 56px | 36px | 1.15 | 首頁 Hero |
| `h1` | 40px | 30px | 1.2 | 頁面主標題（每頁唯一） |
| `h2` | 30px | 24px | 1.3 | 區塊標題 |
| `h3` | 22px | 20px | 1.4 | 卡片標題、小節 |
| `h4` | 18px | 18px | 1.4 | 表單群組標題 |
| `body-lg` | 18px | 17px | 1.75 | 文章內文 |
| `body` | 16px | 16px | 1.7 | 一般內文 |
| `body-sm` | 14px | 14px | 1.6 | 說明、表格 |
| `caption` | 13px | 13px | 1.5 | 標籤、時間 |
| `mono` | 14px | 14px | 1.4 | 日期、價格、名額 |

> 中文內文行高設定為 1.7 以上，比英文網站常見的 1.5 寬鬆，中文閱讀會比較舒服。文章段落最大寬度 `68ch`（約 34 個中文字）。

---

## 4. 間距、格線與尺寸

### 4.1 間距（4px 基準）

| Token | 值 | 常見用途 |
| --- | --- | --- |
| `space-1` | 4px | 圖示與文字間距 |
| `space-2` | 8px | 標籤內距 |
| `space-3` | 12px | 表單元件內距 |
| `space-4` | 16px | 卡片內距（手機）、行動版左右邊界 |
| `space-5` | 24px | 卡片內距（桌機）、元件間距 |
| `space-6` | 32px | 區塊內小節間距 |
| `space-7` | 48px | 區塊間距（手機） |
| `space-8` | 64px | 區塊間距（桌機） |
| `space-9` | 96px | 首頁大區塊 |

### 4.2 斷點與格線

| 名稱 | 寬度 | 欄數 | 欄間距 | 左右邊界 | 對應裝置 |
| --- | --- | --- | --- | --- | --- |
| Mobile | < 768px | 4 | 16px | 16px | 手機 |
| Tablet | 768–1023px | 8 | 24px | 32px | 平板直向 |
| Desktop | ≥ 1024px | 12 | 24px | 自動置中 | 平板橫向、筆電 |
| Wide | ≥ 1280px | 12 | 32px | 內容最大寬 1200px | 桌機 |

採 **Mobile-first**：預設樣式為手機，以 `@include bp(md)` 往上擴充。

### 4.3 圓角與陰影

圓角刻意偏小，接近紙本、卡片的質感，不走「大圓角泡泡」風格。

| Token | 值 | 用途 |
| --- | --- | --- |
| `radius-sm` | 4px | 標籤、Checkbox |
| `radius-md` | 8px | 按鈕、輸入框 |
| `radius-lg` | 12px | 卡片、Modal |
| `radius-full` | 999px | 頭像、Pill 篩選標籤 |

陰影帶暖色調（以 ink 色為基底，而非純黑），只用在「浮在上層」的元素：

| Token | 值 | 用途 |
| --- | --- | --- |
| `shadow-sm` | `0 1px 2px rgb(31 27 22 / 0.06)` | 卡片 hover 前 |
| `shadow-md` | `0 4px 12px rgb(31 27 22 / 0.08)` | 卡片 hover、Dropdown |
| `shadow-lg` | `0 16px 40px rgb(31 27 22 / 0.14)` | Modal、Toast |

### 4.4 Z-index 層級

`dropdown 100` → `sticky header 200` → `overlay 300` → `modal 400` → `toast 500`。統一管理，避免出現 `z-index: 9999`。

---

## 5. 動態（Motion）

| Token | 時間 | 用途 |
| --- | --- | --- |
| `duration-fast` | 120ms | Hover、按下 |
| `duration-base` | 200ms | Dropdown、Tabs 切換 |
| `duration-slow` | 320ms | Modal、Toast 進場 |
| `ease-out` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | 進場 |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | 退場 |

- 只對 `transform` 與 `opacity` 做動畫，不對 `width`、`top` 做動畫（後者會觸發重排，造成卡頓）。
- 尊重 `prefers-reduced-motion: reduce`：關閉位移動畫，只保留淡入淡出。
- 卡片 hover：上移 2px + 陰影加深 + 圖片放大 1.03 倍。

---

## 6. 元件規範

所有互動元件都必須定義以下狀態：**Default／Hover／Active／Focus-visible／Disabled**，有非同步行為的再加上 **Loading**、有驗證的再加上 **Error**。

### 6.1 Button

| 變體 | 樣式 | 使用時機 |
| --- | --- | --- |
| `primary` | clay-600 底、白字 | 每個畫面最重要的一個行動（立即預約、送出） |
| `secondary` | surface 底、ink 字、line-strong 邊框 | 次要行動（取消、返回） |
| `ghost` | 透明底、ink 字 | 工具列、低強調行動 |
| `danger` | danger 底、白字 | 刪除、取消預約（必定搭配確認 Modal） |

| 尺寸 | 高度 | 左右內距 | 字級 |
| --- | --- | --- | --- |
| `sm` | 32px | 12px | 14px |
| `md` | 40px | 16px | 15px |
| `lg` | 48px | 24px | 16px |

- 手機上可點擊區域至少 44 × 44px（`sm` 按鈕在手機上會擴大可點擊範圍）。
- Loading：顯示 spinner、保持原寬度（避免按鈕跳動）、`aria-busy="true"`、禁止重複點擊。
- Focus：`outline: 2px solid var(--color-focus); outline-offset: 2px;`，只在鍵盤操作時顯示（`:focus-visible`）。

### 6.2 表單元件（Input／Select／Textarea／Checkbox／Radio）

- 高度 44px，邊框 `line-strong`，focus 時邊框改為 focus 色並加 3px 淡色光暈。
- **標籤一律顯示在欄位上方**，不以 placeholder 取代 label（placeholder 輸入後就會消失，且對比度低）。
- 必填以「＊」標示，並在表單開頭說明。
- 錯誤狀態：邊框 danger、欄位下方顯示錯誤訊息（附圖示，不只靠顏色區分）、`aria-invalid="true"` 與 `aria-describedby` 指向錯誤訊息。
- 驗證時機：**離開欄位（blur）時驗證**；送出時驗證全部並把焦點移到第一個錯誤欄位。不在使用者還在打字時就顯示錯誤。

### 6.3 工作坊卡片（WorkshopCard）——招牌元件

```text
┌──────────────────────────────────┬───────────┐
│ [ 4:3 圖片 ]                      │  DEC      │
│                                   │  14       │  ← 票根：Mono 字體
│ ● 陶藝 · 台北大安                   │  SAT      │
│ 拉坯入門：做出第一只茶碗             ├ ─ ─ ─ ─ ─ ┤  ← 虛線打孔
│ ★ 4.8 (126) · 新手友善 · 3 小時     │  剩 3 位   │
│ NT$ 1,800                    ♡   │           │
└──────────────────────────────────┴───────────┘
```
- 桌機為直式卡片（圖片在上、票根在右下角），手機為橫式列表卡片（節省垂直空間）。
- 剩餘名額 ≤ 3 時以 warning 色強調；額滿時卡片顯示「額滿」，票根改為灰色。
- 整張卡片可點擊（以標題連結延伸點擊範圍，避免巢狀連結），收藏按鈕獨立可聚焦。

### 6.4 其他共用元件

| 元件 | 重點規範 |
| --- | --- |
| Modal | 開啟時焦點移入、`Tab` 循環於 Modal 內、`Esc` 關閉、關閉後焦點回到觸發按鈕、背景不可捲動、`role="dialog"` + `aria-modal` |
| Dropdown | 方向鍵移動、`Enter` 選取、`Esc` 關閉、點擊外部關閉 |
| Tabs | `role="tablist"`，左右方向鍵切換，只有目前的 Tab 在 Tab 順序中 |
| Pagination | 顯示目前頁／總頁數，`aria-current="page"`；手機版簡化為「上一頁 ‧ 3/12 ‧ 下一頁」 |
| Toast | 右下角（手機為底部置中），3 秒自動消失，滑鼠移入或聚焦時暫停計時；`role="status"`（錯誤用 `role="alert"`） |
| Skeleton | 與實際內容同尺寸，以 sunken 色 + 緩慢光澤動畫；`aria-hidden`，外層容器 `aria-busy` |
| Empty State | 線條插圖 + 一句說明 + 一個主要行動（例如「清除篩選條件」） |
| Error State | 說明發生什麼事 + 使用者可以怎麼做 + 重試按鈕；不顯示技術錯誤碼給一般使用者 |
| Breadcrumb | `<nav aria-label="麵包屑">` + `<ol>`，最後一項 `aria-current="page"`，手機版只顯示上一層 |

---

## 7. 圖示與圖片

- **圖示**：使用 Lucide 的線條圖示（1.5px 線寬），只引入用到的 SVG 圖示，不載入整套字型圖示。
- **工作坊圖片**：比例統一 4:3（卡片）／16:9（詳細頁主圖），使用 `@nuxt/image` 輸出 WebP/AVIF 與 `srcset`；首屏主圖 `fetchpriority="high"`，其餘 `loading="lazy"`；所有圖片給定寬高避免 CLS。
- **圖片來源**：使用可商用的免費圖庫（例如 Unsplash），並在 About 頁與資料檔中標註攝影者出處；不使用 AI 生成的人物照冒充講師。
- **替代文字**：描述圖片內容（「學員在拉坯機上塑形陶土」），而非重複標題。

---

## 8. 文案語氣

- 親切、具體、不誇張：「這週六台北還有 3 個名額」優於「熱門搶手課程！！」。
- 錯誤訊息說明「怎麼解決」：「這個場次剩 2 個名額，請減少人數或選擇其他場次」。
- 按鈕用動詞：「立即預約」「儲存變更」，避免「確定」「OK」這種模糊用詞。
- 全站使用全形標點，中英文之間加半形空格。
