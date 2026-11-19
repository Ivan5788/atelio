// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(
  {
    rules: {
      // 防止 XSS：禁止 v-html（docs/05-security.md C-04）
      'vue/no-v-html': 'error',
      'vue/multi-word-component-names': [
        'error',
        { ignores: ['index', 'default', 'error', 'styleguide'] },
      ],
      'vue/require-default-prop': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
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
  // 關閉與 Prettier 衝突的格式規則：格式交給 Prettier，ESLint 只管程式品質
  prettier,
)
