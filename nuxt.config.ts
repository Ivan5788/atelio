// https://nuxt.com/docs/api/configuration/nuxt-config
//
// 渲染策略與資安設定的決策理由見 docs/04-architecture.md（ADR-001、ADR-003）
// 與 docs/05-security.md。

const noindex = { 'X-Robots-Tag': 'noindex, nofollow' }

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

  vite: {
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
    public: {
      siteUrl: 'http://localhost:3000',
    },
  },

  routeRules: {
    // 建置時產生靜態 HTML
    '/': { prerender: true },
    // 以下頁面在 Phase 4 完成後取消註解；路徑寫進 prerender 但頁面不存在時，建置會失敗。
    // '/faq': { prerender: true },
    // '/about': { prerender: true },
    // '/for-organizers': { prerender: true },
    '/journal/**': { prerender: true },
    // '/instructors': { prerender: true },

    // Vercel ISR：第一次請求時渲染，之後 CDN 快取 1 小時
    '/workshops/**': { isr: 3600 },
    '/categories/**': { isr: 3600 },
    '/cities/**': { isr: 3600 },
    '/instructors/**': { isr: 3600 },
    // '/workshops'（列表本身）刻意不設定：ISR 會忽略 query string，
    // 篩選條件會失效，所以列表維持每次請求 SSR。

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
    storage: {
      data: useUpstash ? { driver: 'upstash' } : { driver: 'memory' },
    },
  },

  security: {
    // Prerender 與 ISR 頁面的 HTML 會被 CDN 快取，每次請求產生的 nonce 會失效，
    // 所以關閉 nonce；靜態頁改用 script hash（ssg.hashScripts）。
    // SSR 頁面的 inline script 目前以 'unsafe-inline' 放行，這是已知取捨，
    // Phase 6 會實測 CSP 並記錄結果（docs/05-security.md C-05）。
    nonce: false,
    ssg: {
      meta: true,
      hashScripts: true,
      hashStyles: false,
    },
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https://images.unsplash.com'],
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
    // 建置警告顯示目前的 Vite 使用 oxc、會忽略 esbuild 的 drop 設定，nuxt-security 移除 console 的功能因此不生效；
    // 關閉以免誤以為有作用；正式環境的 console 由 ESLint no-console 規則把關。
    removeLoggers: false,
  },

  fonts: {
    // 只下載標題與數字用的字型；內文使用系統字體（零下載，有利 LCP）
    families: [
      { name: 'Noto Serif TC', weights: [600, 700] },
      { name: 'IBM Plex Mono', weights: [500] },
    ],
  },

  image: {
    domains: ['images.unsplash.com'],
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
