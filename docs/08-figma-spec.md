# Atelio Figma 建檔規格

> 版本：v0.3.2・最後更新：2026-11-19
> 對應文件：[06-design-system.md](06-design-system.md)（Token 定義）、[07-wireframes.md](07-wireframes.md)（版面）
> Token 原始檔：[design/tokens/atelio.tokens.json](../design/tokens/atelio.tokens.json)

這份文件說明如何把視覺設計稿重建成一份**結構完整的 Figma 檔**。目標不是「畫得像」，而是讓面試官打開檔案時，看得出：

- 顏色、間距都綁定 Variables，沒有寫死的色碼；
- 元件有 Variants 與 Component Properties，狀態齊全；
- 版面全部使用 Auto Layout，可以拉伸檢查 RWD；
- 命名與程式碼的 Token、元件名稱一一對應（設計與前端是同一套語言）。

---

## 1. 檔案結構（Pages）

| Page | 內容 |
| --- | --- |
| `📖 Cover` | 封面：專案名稱、版本、連結（Demo 站、GitHub、設計規範文件） |
| `🎨 Foundations` | 色票、字級、間距、圓角、陰影的展示板（全部引用 Variables／Styles） |
| `🧩 Components` | 所有元件與 Variants，依第 4 節分區 |
| `📱 Mobile` | 390px 寬的頁面設計 |
| `🖥 Desktop` | 1440px 寬的頁面設計 |
| `🔀 Flows` | 預約流程、Studio CRUD 的原型連線（Prototype） |
| `🗄 Archive` | 被淘汰的方案（v0.1 工坊手記、v0.2 粉彩初版），保留設計決策的演進過程 |

> 保留 Archive 頁是刻意的：面試時可以說明「為什麼從 v0.1 改到 v0.3」，展示迭代能力。

---

## 2. Variables

### 2.1 Collections

| Collection | Modes | 內容 | 說明 |
| --- | --- | --- | --- |
| `primitive` | `default` | `color/*` 原始色票 | 設定 **Hide from publishing**，元件不直接使用 |
| `semantic` | `light`（預留 `dark`） | `color/bg/*`、`color/text/*`、`color/border/*`、`color/action/*`、`color/status/*`、`color/category/*` | 全部 **alias** 到 primitive |
| `layout` | `mobile`、`desktop` | `space/*`、`radius/*`、`font-size/*` | 字級在兩個 mode 有不同值（例如 `h1` 30／40） |

**為什麼分兩層色彩：** 元件只引用 semantic（例如 `text/default`），將來要做深色模式，只需替 semantic 加一個 `dark` mode，元件完全不用動。這和程式端 `--color-text` 引用 `--cocoa-900` 的做法一致。

### 2.2 Scoping（限制 Variable 出現的位置）

| Variable 群組 | Scope |
| --- | --- |
| `color/bg/*`、`color/action/*-bg` | Frame fill、Shape fill |
| `color/text/*`、`color/action/*-fg` | Text fill |
| `color/border/*` | Stroke |
| `space/*` | Gap、Padding |
| `radius/*` | Corner radius |

設好 Scope 後，在文字上選色時只會看到文字色，可以避免「把 ink-muted 放到腮紅底」這類不合規的組合。

### 2.3 匯入方式

`design/tokens/atelio.tokens.json` 採 W3C Design Tokens（DTCG）格式，可擇一匯入：

1. **Tokens Studio for Figma**（外掛）：Load from file → 選擇 JSON → 「Create Variables」。
2. **Figma 原生匯入**：如果你使用的 Figma 版本在 Variables 面板提供 JSON 匯入，可以直接匯入；若沒有這個選項，請用方法 1。
3. **手動建立**：Token 數量約 70 個，手動建立約 30–40 分鐘，也是熟悉 Variables 的好練習。

> 匯入後請抽查 3–5 個 alias 是否正確指向 primitive。

---

## 3. Styles

### 3.1 Text Styles

命名：`{角色}/{token}`，字級與行高綁定 `layout` collection 的 Variables。

| Style | 字體 | 字重 | 桌機／手機 | 行高 |
| --- | --- | --- | --- | --- |
| `display/display` | Noto Serif TC | 700 | 56／36 | 115% |
| `heading/h1` | Noto Serif TC | 700 | 40／30 | 120% |
| `heading/h2` | Noto Serif TC | 700 | 30／24 | 130% |
| `heading/h3` | Noto Serif TC | 600 | 22／20 | 140% |
| `heading/h4` | Noto Serif TC | 600 | 18 | 140% |
| `body/lg` | Noto Sans TC | 400 | 18／17 | 175% |
| `body/md` | Noto Sans TC | 400 | 16 | 170% |
| `body/md-strong` | Noto Sans TC | 500 | 16 | 170% |
| `body/sm` | Noto Sans TC | 400 | 14 | 160% |
| `caption` | Noto Sans TC | 400 | 13 | 150% |
| `mono/md` | IBM Plex Mono | 500 | 14 | 140% |
| `mono/ticket-day` | IBM Plex Mono | 500 | 26／22 | 100% |
| `mono/overline` | IBM Plex Mono | 500 | 12，字距 12% | 140% |

> 網站內文實際使用系統字體（零下載，有利 LCP）；Figma 中以 Noto Sans TC 代表，兩者字面寬度接近。

### 3.2 Effect Styles

`shadow/sm`、`shadow/md`、`shadow/lg`、`shadow/sticker`、`shadow/sticker-hover`，數值見 tokens JSON。

---

## 4. 元件（Components）

### 4.1 命名與屬性規則

- 元件名稱與 Vue 元件同名：Figma `Button` ↔ `app/components/base/BaseButton.vue`。
- Variant 屬性用小寫英文，值與程式 props 一致：`variant=primary`、`size=md`、`state=hover`。
- 能用 **Boolean／Text／Instance swap** 屬性處理的就不要開 Variant（例如「有沒有圖示」用 Boolean `hasIcon`），避免 Variant 數量爆炸。
- 所有元件內部使用 Auto Layout，padding 與 gap 綁定 `space/*`。

### 4.2 元件清單

| 元件 | Variant 屬性 | 其他屬性 | 狀態 |
| --- | --- | --- | --- |
| `Button` | `variant`: primary／secondary／ghost／danger；`size`: sm／md／lg | `label` (Text)、`hasIcon` (Boolean)、`icon` (Instance swap) | default／hover／active／focus／disabled／loading |
| `IconButton` | `size`: sm／md | `icon`、`pressed` (Boolean，收藏用) | default／hover／focus／disabled |
| `Input` | `type`: text／search／select／textarea | `label`、`helper`、`required` (Boolean) | default／hover／focus／error／disabled |
| `Checkbox`／`Radio` | `checked`: true／false | `label` | default／focus／disabled |
| `Chip`（篩選標籤） | `selected`: true／false | `label`、`removable` (Boolean) | default／hover／focus |
| `CategoryDot` | `category`: 8 種分類 | — | — |
| `StatusPill` | `status`: success／warning／danger／info | `label` | — |
| `TicketStub` | `seats`: normal／low／full | `month`、`day`、`weekday`、`seatsLabel` | — |
| `WorkshopCard` | `layout`: vertical（桌機）／horizontal（手機）；`seats`: normal／low／full | `favorited` (Boolean) | default／hover |
| `SessionOption`（場次選項） | `state`: default／selected／full | `when`、`seats` | — |
| `Header` | `breakpoint`: mobile／desktop；`auth`: guest／member | — | — |
| `DemoBanner` | `breakpoint`: mobile／desktop | — | — |
| `Footer` | `breakpoint`: mobile／desktop | — | — |
| `Breadcrumb` | `breakpoint`: mobile／desktop | — | — |
| `Pagination` | `breakpoint`: mobile／desktop | — | — |
| `Modal`、`Toast`、`EmptyState`、`ErrorState`、`Skeleton` | 依 06 文件第 6.4 節 | — | — |

### 4.3 狀態的畫法

- **Focus**：2px `border/focus` 外框、外推 2px（用 Stroke outside 或多一層 Frame），每個可互動元件都要有。
- **Disabled**：改用 `bg/sunken` 底與 `text/muted` 字，**不要用透明度**（透明度會讓對比度失準）。
- **Hover**：卡片與主要按鈕上移 2px，Effect 從 `shadow/sticker` 換成 `shadow/sticker-hover`。
- **Loading**：保持按鈕寬度，文字換成 spinner。

---

## 5. 頁面與版面

### 5.1 Frame 尺寸與格線

| 斷點 | Frame 寬 | Layout Grid |
| --- | --- | --- |
| Mobile | 390 | 4 欄、gutter 16、margin 16 |
| Tablet（選做） | 768 | 8 欄、gutter 24、margin 32 |
| Desktop | 1440 | 12 欄、gutter 32、內容最大寬 1200 置中 |

### 5.2 必做頁面

| 頁面 | Mobile | Desktop | 備註 |
| --- | --- | --- | --- |
| 首頁 | ✅ | ✅ | 已有設計稿 |
| 工作坊列表（含篩選） | ✅ | ✅ | Mobile 篩選為底部抽屜 |
| 工作坊詳細 | ✅ | ✅ | 已有設計稿 |
| 預約流程（3 步驟＋完成） | ✅ | — | 用於 Flows 原型 |
| 會員：我的預約 | ✅ | ✅ | |
| Studio：儀表板、課程列表、編輯表單 | — | ✅ | 開課者後台以桌機為主 |
| 狀態頁：空狀態、錯誤、404 | ✅ | — | |

### 5.3 Auto Layout 檢查方式

完成後把 Desktop Frame 從 1440 拉到 1024，再拉到 1920：內容應該置中、卡片網格自動換行，**不應出現重疊或被裁切的元素**。這個動作也可以在面試時現場示範。

---

## 6. 與目前設計稿不一致、需在 Figma 統一的地方

| 項目 | 設計稿現況 | Figma 以此為準 |
| --- | --- | --- |
| 頁面中的按鈕圓角 | 部分為 12px | 依規範使用 `radius/full`（膠囊形） |
| 內文字體 | Noto Sans TC | 同左（網站實作改用系統字體，見 3.1 備註） |
| 收藏按鈕的已收藏狀態 | 只在詳細頁出現 | 做成 `IconButton` 的 `pressed` 屬性 |

---

## 7. 交付檢查清單

- [ ] 所有顏色都綁定 semantic Variables（用 Selection colors 檢查，不應出現未綁定的色碼）
- [ ] 所有間距、圓角綁定 Variables
- [ ] 每個互動元件有 focus 與 disabled 狀態
- [ ] 文字與底色組合符合 06 文件 2.2 節的對比矩陣
- [ ] Desktop Frame 拉伸測試通過
- [ ] Flows 頁的預約原型可以從首頁點到完成頁
- [ ] 檔案分享權限設為「Anyone with the link can view」，連結放進 README

> 匯出檔案或分享連結由求職者本人操作；連結取得後再更新到 README。
