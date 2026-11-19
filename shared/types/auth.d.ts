// nuxt-auth-utils 的 Session 型別。
// Cookie 雖然加密，大小仍有 4KB 上限，所以只放識別用的最少資料；
// 完整的使用者資料每次從資料庫讀取（server/utils/auth.ts）。
declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    isDemo: boolean
  }
}

export {}
