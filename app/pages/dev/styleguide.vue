<script setup lang="ts">
/**
 * 活的設計規範：色票與對比值直接讀取 design/tokens/atelio.tokens.json 計算，
 * 不是手抄的數字，所以 token 一改，這一頁與單元測試會同步反映。
 */
import {
  palette,
  semanticColors,
  TEXT_COLORS,
  GENERAL_BACKGROUNDS,
  RESTRICTED_BACKGROUNDS,
} from '~/utils/design-tokens'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: '設計規範 Styleguide',
  description: 'Atelio 設計系統：色彩、字級、間距、元件與對比度驗證。',
  robots: 'noindex, nofollow',
})

const semanticGroups = computed(() => {
  const groups: Record<string, [string, string][]> = {}
  for (const [name, hex] of Object.entries(semanticColors)) {
    const group = name.split('-')[0]!
    ;(groups[group] ??= []).push([name, hex])
  }
  return groups
})

const matrixBackgrounds = [...GENERAL_BACKGROUNDS, ...Object.keys(RESTRICTED_BACKGROUNDS)]

function cell(text: string, bg: string) {
  const ratio = contrastRatio(semanticColors[text]!, semanticColors[bg]!)
  const restricted = RESTRICTED_BACKGROUNDS[bg]
  const allowed = !restricted || restricted.includes(text)
  return { ratio: ratio.toFixed(2), level: wcagLevel(ratio), allowed }
}

const typeTokens = [
  ['display', '找一個週末，親手做點什麼'],
  ['h1', '頁面主標題 Heading 1'],
  ['h2', '區塊標題 Heading 2'],
  ['h3', '卡片標題 Heading 3'],
  ['h4', '表單群組 Heading 4'],
  ['body-lg', '文章內文：從揉土、定中心、開孔到拉高與修形。'],
  ['body', '一般內文：講師一對四示範與調整手勢。'],
  ['body-sm', '說明文字：課程結束後由工作室代為燒製。'],
  ['caption', '標籤・時間 2026/12/14'],
  ['mono', 'NT$ 1,800 · DEC 14 · 剩 3 位'],
] as const

const spaceTokens = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const radiusTokens = ['sm', 'md', 'lg', 'full']
const shadowTokens = ['sm', 'md', 'lg', 'sticker', 'sticker-hover']
const buttonVariants = ['primary', 'secondary', 'ghost', 'danger'] as const
const buttonSizes = ['sm', 'md', 'lg'] as const

const loadingDemo = ref(false)
function triggerLoading() {
  loadingDemo.value = true
  setTimeout(() => (loadingDemo.value = false), 1500)
}
</script>

<template>
  <div class="container styleguide">
    <header class="styleguide__intro">
      <p class="styleguide__overline">ATELIO DESIGN SYSTEM · v0.3.2</p>
      <h1>設計規範</h1>
      <p class="styleguide__lead">
        所有數值來自 <code>design/tokens/atelio.tokens.json</code>，與 Figma Variables、SCSS
        使用同一份來源。對比度在此頁即時計算。
      </p>
    </header>

    <section aria-labelledby="sg-palette">
      <h2 id="sg-palette">原始色票</h2>
      <p class="styleguide__note">元件不直接使用這一層，只透過語意色引用。</p>
      <ul class="swatches" role="list">
        <li v-for="(hex, name) in palette" :key="name" class="swatch">
          <span class="swatch__chip" :style="{ background: hex }" />
          <span class="swatch__name">{{ name }}</span>
          <code class="swatch__hex">{{ hex }}</code>
        </li>
      </ul>
    </section>

    <section aria-labelledby="sg-semantic">
      <h2 id="sg-semantic">語意色</h2>
      <div v-for="(items, group) in semanticGroups" :key="group" class="semantic-group">
        <h3>{{ group }}</h3>
        <ul class="swatches swatches--compact" role="list">
          <li v-for="[name, hex] in items" :key="name" class="swatch">
            <span class="swatch__chip" :style="{ background: hex }" />
            <span class="swatch__name">--color-{{ name }}</span>
            <code class="swatch__hex">{{ hex }}</code>
          </li>
        </ul>
      </div>
    </section>

    <section aria-labelledby="sg-contrast">
      <h2 id="sg-contrast">對比度矩陣</h2>
      <p class="styleguide__note">
        一般文字需 ≥ 4.5。灰底格為規範不允許的組合（飽和色塊只放指定文字色），不列入檢查。
      </p>
      <div class="matrix" role="region" aria-label="對比度矩陣，可水平捲動" tabindex="0">
        <table>
          <thead>
            <tr>
              <th scope="col">文字 ＼ 底色</th>
              <th v-for="bg in matrixBackgrounds" :key="bg" scope="col">{{ bg }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="text in TEXT_COLORS" :key="text">
              <th scope="row">{{ text }}</th>
              <td
                v-for="bg in matrixBackgrounds"
                :key="bg"
                :class="{ 'is-excluded': !cell(text, bg).allowed }"
              >
                <span
                  class="matrix__sample"
                  :style="{ color: semanticColors[text], background: semanticColors[bg] }"
                >
                  {{ cell(text, bg).ratio }}
                </span>
                <span class="matrix__level">
                  {{ cell(text, bg).allowed ? cell(text, bg).level : '不使用' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="sg-type">
      <h2 id="sg-type">字級</h2>
      <p class="styleguide__note">字級以 rem 輸出，手機到桌機之間以 clamp() 平滑縮放。</p>
      <dl class="type-list">
        <div v-for="[token, sample] in typeTokens" :key="token" class="type-list__row">
          <dt>
            <code>{{ token }}</code>
          </dt>
          <dd :class="`type-sample type-sample--${token}`">{{ sample }}</dd>
        </div>
      </dl>
    </section>

    <section aria-labelledby="sg-space">
      <h2 id="sg-space">間距、圓角、陰影</h2>
      <div class="token-row">
        <div v-for="s in spaceTokens" :key="s" class="space-sample">
          <span class="space-sample__bar" :style="{ width: `var(--space-${s})` }" />
          <code>space-{{ s }}</code>
        </div>
      </div>
      <div class="token-row">
        <div
          v-for="r in radiusTokens"
          :key="r"
          class="box-sample"
          :style="{ borderRadius: `var(--radius-${r})` }"
        >
          <code>radius-{{ r }}</code>
        </div>
      </div>
      <div class="token-row">
        <div
          v-for="s in shadowTokens"
          :key="s"
          class="box-sample"
          :style="{ boxShadow: `var(--shadow-${s})` }"
        >
          <code>shadow-{{ s }}</code>
        </div>
      </div>
    </section>

    <section aria-labelledby="sg-button">
      <h2 id="sg-button">Button</h2>
      <div class="button-grid">
        <div v-for="variant in buttonVariants" :key="variant" class="button-grid__row">
          <code>{{ variant }}</code>
          <BaseButton v-for="size in buttonSizes" :key="size" :variant="variant" :size="size">
            {{ size.toUpperCase() }} 按鈕
          </BaseButton>
          <BaseButton :variant="variant" disabled>Disabled</BaseButton>
        </div>
      </div>
      <div class="token-row">
        <BaseButton :loading="loadingDemo" @click="triggerLoading">點擊看 Loading</BaseButton>
        <BaseButton variant="secondary" to="/">連結樣式的按鈕</BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.styleguide {
  display: flex;
  flex-direction: column;
  gap: space(8);
  padding-block: space(7) space(9);

  section {
    display: flex;
    flex-direction: column;
    gap: space(4);
  }

  &__overline {
    @include text('mono');
    font-size: rem(12px);
    letter-spacing: 0.12em;
    color: color('text-muted');
  }

  &__intro {
    display: flex;
    flex-direction: column;
    gap: space(3);
  }

  &__lead,
  &__note {
    color: color('text-muted');
    max-width: 68ch;
  }

  &__note {
    @include text('body-sm');
  }

  code {
    @include text('mono');
    font-size: rem(13px);
  }
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: space(4);
  padding: 0;

  &--compact {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

.swatch {
  display: grid;
  grid-template-columns: 40px 1fr;
  grid-template-rows: auto auto;
  column-gap: space(3);
  align-items: center;

  &__chip {
    grid-row: span 2;
    width: 40px;
    height: 40px;
    border-radius: radius('md');
    border: 1px solid color('border-subtle');
  }

  &__name {
    @include text('body-sm');
    overflow-wrap: anywhere;
  }

  &__hex {
    color: color('text-muted');
  }
}

.semantic-group {
  display: flex;
  flex-direction: column;
  gap: space(3);

  h3 {
    @include text('h4');
    text-transform: capitalize;
  }
}

.matrix {
  overflow-x: auto;
  border: 1px solid color('border-subtle');
  border-radius: radius('lg');
  background: color('bg-surface');

  table {
    border-collapse: collapse;
    @include text('caption');
  }

  th,
  td {
    padding: space(2) space(3);
    border-bottom: 1px solid color('border-subtle');
    text-align: center;
    white-space: nowrap;
  }

  thead th {
    font-weight: 500;
  }

  tbody th {
    text-align: left;
    font-weight: 500;
  }

  td.is-excluded {
    background: color('bg-sunken');

    .matrix__sample {
      opacity: 0.35;
    }
  }

  &__sample {
    display: block;
    padding: space(1) space(2);
    border-radius: radius('sm');
    @include text('mono');
  }

  &__level {
    display: block;
    margin-top: space(1);
    color: color('text-muted');
  }
}

.type-list {
  display: flex;
  flex-direction: column;

  &__row {
    display: grid;
    gap: space(2);
    padding-block: space(4);
    border-top: 1px solid color('border-subtle');

    @include bp(md) {
      grid-template-columns: 120px 1fr;
      align-items: baseline;
    }
  }

  dd {
    margin: 0;
  }
}

.type-sample {
  @each $token
    in ('display', 'h1', 'h2', 'h3', 'h4', 'body-lg', 'body', 'body-sm', 'caption', 'mono')
  {
    &--#{$token} {
      @include text($token);
    }
  }
}

.token-row {
  display: flex;
  flex-wrap: wrap;
  gap: space(5);
  align-items: flex-end;
}

.space-sample {
  display: flex;
  flex-direction: column;
  gap: space(2);

  &__bar {
    height: 24px;
    background: var(--palette-sky-800);
    border-radius: 2px;
  }
}

.box-sample {
  display: flex;
  align-items: flex-end;
  width: 140px;
  height: 96px;
  padding: space(3);
  background: color('bg-surface');
  border: 1px solid color('border-subtle');
}

.button-grid {
  display: flex;
  flex-direction: column;
  gap: space(4);

  &__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(3);

    code {
      width: 88px;
    }
  }
}
</style>
