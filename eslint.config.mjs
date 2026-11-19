// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(
  {
    rules: {
      // 防止 XSS：禁止 v-html（docs/05-security.md C-04）
      'vue/no-v-html': 'error',
      'vue/require-default-prop': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // 頁面與版面的檔名就是路由（[slug]、search），不需要多字命名；一般元件仍需遵守
    files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue', 'app/error.vue', 'app/app.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    // 分層規則：前端不得 import server 端程式（docs/04-architecture.md 規則 6）
    files: ['app/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/server/**', '~~/server/**'],
              message: 'app/ 不得 import server/ 的程式，請透過 API 呼叫。',
            },
          ],
        },
      ],
    },
  },
  {
    // 測試需要解析沒有型別的 JSON（API 回應、JSON-LD），允許 any
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  // 關閉與 Prettier 衝突的格式規則：格式交給 Prettier，ESLint 只管程式品質
  prettier,
)
