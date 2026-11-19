import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

// 兩種測試分開跑：
// - unit：純函式，Node 環境，速度最快
// - nuxt：需要 Nuxt 執行環境的元件測試（auto-import、NuxtLink…）
export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '~': fileURLToPath(new URL('./app', import.meta.url)),
            '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
          },
        },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.spec.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.spec.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
