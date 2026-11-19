// https://nuxt.com/docs/api/configuration/nuxt-config
//
// 渲染策略與資安設定的決策理由見 docs/04-architecture.md（ADR-001、ADR-003）
// 與 docs/05-security.md。

import { articles } from './server/data/articles'

// 快取一小時的公開頁面：Vercel 上用 ISR（快取在 CDN，所有實例共用）；
// 其他環境（本機預覽、CI 的 E2E）用 Nitro 的 SWR。
// 原因：node 環境不支援 ISR 規則，但前端仍會依規則預先載入 _payload.json，
// 伺服器卻不產生，每頁都會出現 404（本機實測）。改用 SWR 後兩邊行為一致。
const isVercel =
  Boolean(process.env.VERCEL) || Boolean(process.env.NITRO_PRESET?.startsWith('vercel'))
const cachedPage = isVercel ? { isr: 3600 } : { swr: 3600 }

const noindex = { 'X-Robots-Tag': 'noindex, nofollow' }

// 全站是否開放搜尋引擎索引（預設不開放）。本站使用虛構資料，只展示 SEO 技術，不希望被無關的人搜尋到。
// 關閉時：所有回應加上 X-Robots-Tag: noindex、每頁輸出 robots noindex、robots.txt 不列 sitemap 並擋 AI 爬蟲。
// 這個值在「建置時」決定（標頭寫進路由規則），修改後需要重新部署。
const indexable = process.env.NUXT_PUBLIC_INDEXABLE === 'true'

// 正式網址：優先使用環境變數，其次使用 Vercel 自動提供的正式網域，本機為 localhost
const siteUrl =
  process.env.NUXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

// Upstash 環境變數存在時（Vercel 正式／預覽環境）使用 Redis；
// 本機沒有設定時改用 memory，clone 下來不需要任何帳號就能執行。
// 這段在「建置時」判斷，所以 Vercel 上要在 Build 階段就提供這兩個變數。
const useUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
)

export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'nuxt-security',
    'nuxt-auth-utils',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
  ],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant-TW' },
      titleTemplate: '%s | Atelio',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [{ rel: 'icon', href: '/favicon.ico' }],
    },
  },

  css: ['~/assets/styles/main.scss'],

  // 元件名稱直接使用檔名（AppHeader、WorkshopCard），不加資料夾前綴；
  // 檔名本身已帶有分類（Base／App／Workshop…），搜尋程式碼時名稱與檔名一致。
  components: [{ path: '~/components', pathPrefix: false }],

  vite: {
    // 開發模式預先打包，避免第一次載入頁面時才發現依賴而整頁重新載入
    optimizeDeps: {
      include: ['lucide-vue-next', 'zod'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 讓每個元件的 <style lang="scss"> 都能直接使用 token 與 mixin，
          // 但 abstracts 只包含變數、函式、mixin，不輸出任何 CSS，不會重複打包。
          additionalData: '@use "~/assets/styles/abstracts" as *;\n',
        },
      },
    },
  },

  // 機密只放在私有 runtimeConfig；只有 public 區塊會送到瀏覽器。
  // 實際值由環境變數覆寫：NUXT_PUBLIC_SITE_URL 等。
  runtimeConfig: {
    // Session Cookie 與示範帳號同樣 72 小時到期（docs/05-security.md C-01）
    session: {
      maxAge: 60 * 60 * 72,
    },
    rateLimit: {
      authMax: 10,
      apiMax: 60,
    },
    public: {
      siteUrl,
      indexable,
    },
  },

  auth: {
    // 只在瀏覽器端讀取登入狀態：工作坊頁面會被 ISR 快取給所有人，
    // 如果在伺服器渲染時就把「某人已登入」寫進 HTML，下一位訪客可能看到別人的名字。
    loadStrategy: 'client-only',
  },

  routeRules: {
    // 全站不索引時，每個回應都帶 X-Robots-Tag（比 meta 更全面：圖片、JSON、PDF 也適用）
    ...(indexable ? {} : { '/**': { headers: noindex } }),

    // 首頁有「近期場次」，場次日期依當下時間計算；prerender 會凍結在建置當天，
    // 所以改用 ISR，每小時重新產生一次。
    '/': cachedPage,
    // 首頁的 payload 路徑是 /_payload.json，'/' 規則比對不到（其他頁面由 /xxx/** 萬用規則涵蓋）。
    // Nuxt 只會為 isr 規則自動補上這條，SWR 不會，所以明確寫出（本機實測：未加時回 404）。
    '/_payload.json': cachedPage,
    '/faq': { prerender: true },
    '/about': { prerender: true },
    '/for-organizers': { prerender: true },
    '/journal/**': { prerender: true },
    '/instructors': { prerender: true },

    // Vercel ISR：第一次請求時渲染，之後 CDN 快取 1 小時
    '/workshops/**': cachedPage,
    '/categories/**': cachedPage,
    '/cities/**': cachedPage,
    '/instructors/**': cachedPage,
    // 列表本身明確關閉 ISR：上面的 /workshops/** 也會比對到 /workshops，
    // 但 ISR 會忽略 query string，篩選條件會失效，所以列表維持每次請求 SSR。
    '/workshops': { isr: false, swr: false },

    // 私人頁面：只在瀏覽器渲染，不讓搜尋引擎索引
    '/booking/**': { ssr: false, headers: noindex },
    '/account/**': { ssr: false, headers: noindex },
    '/studio/**': { ssr: false, headers: noindex },
    '/login': { ssr: false, headers: noindex },
    '/register': { ssr: false, headers: noindex },

    // 開發用的設計規範頁：公開讓面試官檢視，但不索引
    '/dev/**': { prerender: true, headers: noindex },

    // API 不快取、不索引
    '/api/**': { headers: { ...noindex, 'Cache-Control': 'no-store' } },
  },

  nitro: {
    // 靜態檔預先壓縮成 gzip／brotli（node 伺服器會直接送出壓縮版；Vercel 本身也會壓縮）
    compressPublicAssets: { gzip: true, brotli: true },
    prerender: {
      // routeRules 的 prerender 只標記「這些路徑要預先產生」，不會自己找出有哪些文章；
      // 不開 crawlLinks（會順著連結把 ISR 頁面也變成靜態），改為明確列出文章網址。
      routes: ['/journal', ...articles.map((a) => `/journal/${a.slug}`)],
    },
    storage: {
      data: useUpstash ? { driver: 'upstash' } : { driver: 'memory' },
    },
  },

  security: {
    // Prerender 與 ISR 頁面的 HTML 會被 CDN 快取，每次請求產生的 nonce 會失效，所以關閉 nonce，全站改用 hash：
    // - 預先產生的頁面：nuxt-security 的 ssg.hashScripts
    // - SSR／ISR 頁面：server/plugins/csp-ssr-hashes.ts（Phase 6 新增）
    // 因此 script-src 不需要 'unsafe-inline'，被注入的內嵌腳本因為 hash 不符而不會執行。
    nonce: false,
    ssg: {
      meta: true,
      hashScripts: true,
      hashStyles: false,
    },
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        // 樣式仍允許 inline：Nuxt 會內嵌元件 CSS、Vue 的 :style 綁定會產生 style 屬性。
        // 樣式注入的風險遠低於腳本注入（無法執行程式），這是記錄在 docs/05-security.md 的取捨。
        'style-src': ["'self'", "'unsafe-inline'"],
        // 照片都放在站內（public/images），不需要允許外部圖片網域
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'none'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': true,
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
      },
    },
    // nuxt-security 內建的限流使用記憶體，Serverless 上每個實例各算各的，
    // 等於沒有限流；改在 server/middleware 使用 @upstash/ratelimit（Phase 4）。
    rateLimiter: false,
    // 請求大小上限 100 KB（C-06）。注意這個設定不檢查 PATCH，server/middleware/01.api-guard.ts 補上。
    requestSizeLimiter: {
      maxRequestSizeInBytes: 100_000,
      maxUploadFileRequestInBytes: 100_000,
    },
    // 建置警告顯示目前的 Vite 使用 oxc、會忽略 esbuild 的 drop 設定，nuxt-security 移除 console 的功能因此不生效；
    // 關閉以免誤以為有作用；正式環境的 console 由 ESLint no-console 規則把關。
    removeLoggers: false,
  },

  fonts: {
    // 只下載標題與數字用的字型；內文使用系統字體（零下載，有利 LCP）
    families: [
      // 中文字型被 Google Fonts 切成一百多個字元區段，每個字重都會產生一百多個 @font-face；
      // 實測 600＋700 兩種字重讓每頁 HTML 內嵌 249 KB 的 CSS，所以只保留 700。
      { name: 'Noto Serif TC', weights: [700] },
      { name: 'IBM Plex Mono', weights: [500] },
    ],
  },

  typescript: {
    strict: true,
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
