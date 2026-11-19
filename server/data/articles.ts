/**
 * 知識專欄文章。內容以結構化區塊表示（段落、標題、清單），
 * 渲染時用一般 Vue 模板輸出，不使用 v-html（docs/05-security.md C-07）。
 * 作者「Atelio 編輯室」為虛構編輯名義，文章內容為一般性的手作建議。
 */
// 相對路徑：這個檔案也會被 nuxt.config.ts 匯入（列出要 prerender 的文章），設定檔環境沒有 #shared 別名
import type { Article } from '../../shared/types/domain'

export const articles: Article[] = [
  {
    slug: 'first-pottery-class-checklist',
    title: '第一次上陶藝課要準備什麼？',
    excerpt: '穿著、指甲長度、作品燒製時間與取件方式，一次說明。',
    kind: 'GUIDE',
    readMinutes: 6,
    category: 'ceramics',
    author: 'Atelio 編輯室',
    publishedAt: '2026-09-12T02:00:00.000Z',
    updatedAt: '2026-11-02T02:00:00.000Z',
    relatedWorkshopSlugs: ['wheel-throwing-basics-taipei', 'hand-building-mugs-taipei'],
    body: [
      {
        type: 'p',
        text: '第一次上陶藝課，最常見的問題不是「學不會」，而是穿錯衣服、指甲太長，或不知道作品要等一個月才能拿。以下整理上課前需要知道的事。',
      },
      { type: 'h2', text: '穿著：選擇可以弄髒的衣服' },
      {
        type: 'p',
        text: '陶土乾掉後會變成粉末，沾到衣服通常洗得掉，但淺色衣物可能留下痕跡。多數工作室會提供圍裙，仍建議穿深色、袖口可以捲起的衣服。',
      },
      { type: 'h2', text: '指甲與飾品' },
      {
        type: 'ul',
        items: [
          '指甲剪短，長指甲會在坯體上留下刮痕',
          '取下戒指與手環，避免卡土或刮傷',
          '長髮請綁起來，拉坯時頭會靠近轉盤',
        ],
      },
      { type: 'h2', text: '作品什麼時候可以拿？' },
      {
        type: 'p',
        text: '課堂上完成的是「坯」，還需要陰乾、素燒、上釉、釉燒。整個流程通常需要三到五週。報名時可以先確認工作室的取件方式，以及是否提供寄送。',
      },
      { type: 'tip', text: '拉坯課通常只會燒製一到兩件作品，課堂上可以多練習，最後再挑最滿意的。' },
      { type: 'h2', text: '手捏還是拉坯？' },
      {
        type: 'p',
        text: '如果想先體驗陶土的手感，手捏課比較輕鬆；如果想挑戰在轉盤上成形，可以直接報名拉坯入門。兩者的差異可以參考〈手捏與拉坯有什麼不同〉。',
      },
    ],
  },
  {
    slug: 'hand-building-vs-wheel-throwing',
    title: '手捏與拉坯有什麼不同？新手該選哪一種',
    excerpt: '比較兩種成形方式的難度、作品風格與適合的人。',
    kind: 'COMPARE',
    readMinutes: 4,
    category: 'ceramics',
    author: 'Atelio 編輯室',
    publishedAt: '2026-09-26T02:00:00.000Z',
    updatedAt: '2026-10-30T02:00:00.000Z',
    relatedWorkshopSlugs: ['hand-building-mugs-taipei', 'wheel-throwing-basics-taipei'],
    body: [
      {
        type: 'p',
        text: '手捏與拉坯都是陶藝的成形方式。手捏用手與簡單工具塑形；拉坯則是在轉動的拉坯機上，利用離心力讓陶土向上成形。',
      },
      { type: 'h2', text: '難度' },
      {
        type: 'p',
        text: '手捏的失敗率較低，幾乎每個人都能完成作品。拉坯的關鍵在於「定中心」，第一次上課可能需要講師協助，但成就感也比較高。',
      },
      { type: 'h2', text: '作品風格' },
      {
        type: 'ul',
        items: [
          '手捏：形狀自由、有手作痕跡，適合不規則的杯子與盤子',
          '拉坯：對稱、圓整，適合碗、杯等圓形器皿',
        ],
      },
      { type: 'h2', text: '怎麼選' },
      {
        type: 'p',
        text: '如果是和朋友、家人一起輕鬆體驗，選手捏；如果想認真學陶藝，或想體驗在轉盤上成形的感覺，選拉坯。',
      },
    ],
  },
  {
    slug: 'leather-care-basics',
    title: '植鞣革作品怎麼保養？',
    excerpt: '從日常清潔、防水到補油，讓手縫皮件越用越好看。',
    kind: 'GUIDE',
    readMinutes: 5,
    category: 'leathercraft',
    author: 'Atelio 編輯室',
    publishedAt: '2026-10-08T02:00:00.000Z',
    updatedAt: '2026-10-08T02:00:00.000Z',
    relatedWorkshopSlugs: ['hand-stitched-wallet-taichung', 'leather-card-holder-taipei'],
    body: [
      {
        type: 'p',
        text: '植鞣革以植物單寧鞣製，特色是會隨著使用與日照逐漸變深、產生光澤。正確保養能讓這個過程更均勻。',
      },
      { type: 'h2', text: '日常清潔' },
      {
        type: 'p',
        text: '用乾的軟布擦拭表面灰塵即可，不要使用濕紙巾或酒精，會讓皮革變乾、出現斑點。',
      },
      { type: 'h2', text: '碰到水怎麼辦' },
      {
        type: 'ul',
        items: [
          '立刻用乾布按壓吸水，不要用力擦',
          '放在通風處自然陰乾，不要用吹風機',
          '完全乾燥後薄塗一層保養油',
        ],
      },
      {
        type: 'tip',
        text: '新的皮件可以先在陽光下曬 30 分鐘左右，讓顏色稍微變深，之後較不容易出現水漬。',
      },
    ],
  },
  {
    slug: 'choosing-a-craft-workshop',
    title: '怎麼挑一堂適合自己的手作課？',
    excerpt: '從時間、預算、作品用途與班級人數，找到不會後悔的課程。',
    kind: 'GUIDE',
    readMinutes: 5,
    category: 'floral',
    author: 'Atelio 編輯室',
    publishedAt: '2026-10-20T02:00:00.000Z',
    updatedAt: '2026-11-05T02:00:00.000Z',
    relatedWorkshopSlugs: ['dried-flower-wreath-tainan', 'watercolor-basics-taipei'],
    body: [
      {
        type: 'p',
        text: '手作課的種類很多，價格從數百元到數千元都有。以下幾個問題可以幫你縮小範圍。',
      },
      { type: 'h2', text: '1. 想不想當天帶走作品？' },
      {
        type: 'p',
        text: '花藝、皮革、木工的作品多半當天完成；陶藝需要燒製，藍染需要晾乾。如果是要送禮，記得把等待時間算進去。',
      },
      { type: 'h2', text: '2. 班級人數' },
      {
        type: 'p',
        text: '需要講師手把手調整的課程（例如拉坯、木工），建議選擇 6 人以下的小班；花藝、水彩等課程 8 到 10 人也能照顧得到。',
      },
      { type: 'h2', text: '3. 難度標示' },
      {
        type: 'ul',
        items: [
          '新手友善：不需要任何經驗',
          '需要基礎：建議先上過相關入門課',
          '進階：需要熟悉工具，課程進度較快',
        ],
      },
      { type: 'tip', text: '不確定的話，先選 2 小時左右的短課程試試看，再決定要不要深入。' },
    ],
  },
]
