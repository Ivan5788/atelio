<script setup lang="ts">
/**
 * Chart.js 包裝元件（ADR-007）。以 <LazyStudioChart> 使用，Nuxt 會把它與 Chart.js 拆成獨立 chunk，
 * 只有進入 Studio 才下載，不影響公開頁面的 bundle。
 *
 * 設計規則（單一數列）：
 * - 單一色相，不放圖例（標題已說明數列）；文字與格線使用文字／邊框 token，不用數列色。
 * - 線寬 2px、資料點直徑 8px；長條圓角 4px；格線淡化。
 * - 一定附上表格檢視：圖表對螢幕閱讀器幾乎無法閱讀，表格提供同樣的數字。
 * - 只 tree-shake 註冊需要的元件（折線、長條、座標軸、Tooltip），不用 chart.js/auto。
 */
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
)

const props = defineProps<{
  type: 'line' | 'bar'
  labels: string[]
  values: number[]
  /** 數值單位，用於 tooltip 與表格，例如「筆」 */
  unit: string
  /** 圖表的文字說明，作為 canvas 的 aria-label */
  summary: string
  tableCaption: string
  labelHeader: string
}>()

const canvasRef = ref<HTMLCanvasElement>()
let chart: Chart | undefined

/** 從 CSS 變數讀取顏色：顏色只定義在 token，圖表不寫死色碼 */
function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function buildConfig(): ChartConfiguration {
  const series = token('--palette-sky-800')
  const text = token('--color-text-muted')
  const grid = token('--color-border-subtle')
  const surface = token('--color-bg-surface')
  const font = { family: getComputedStyle(document.body).fontFamily, size: 13 }
  const horizontal = props.type === 'bar'

  return {
    type: props.type,
    data: {
      labels: props.labels,
      datasets: [
        {
          data: props.values,
          borderColor: series,
          backgroundColor: series,
          borderWidth: 2,
          // 折線
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: series,
          pointBorderColor: surface,
          pointBorderWidth: 2,
          tension: 0.25,
          // 長條
          borderRadius: 4,
          borderSkipped: 'start',
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : undefined,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: token('--color-bg-inverse'),
          titleColor: token('--color-text-inverse'),
          bodyColor: token('--color-text-inverse'),
          padding: 10,
          displayColors: false,
          titleFont: font,
          bodyFont: font,
          callbacks: { label: (ctx) => `${ctx.formattedValue} ${props.unit}` },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { display: horizontal, color: grid },
          border: { display: false },
          ticks: { color: text, font, precision: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { display: !horizontal, color: grid },
          border: { display: false },
          ticks: { color: text, font, precision: 0 },
        },
      },
    },
  }
}

onMounted(() => {
  if (canvasRef.value) chart = new Chart(canvasRef.value, buildConfig())
})

watch(
  () => [props.labels, props.values],
  () => {
    if (!chart) return
    chart.data.labels = props.labels
    chart.data.datasets[0]!.data = props.values
    chart.update()
  },
  { deep: true },
)

onBeforeUnmount(() => chart?.destroy())
</script>

<template>
  <div class="chart">
    <div class="chart__canvas" :class="`chart__canvas--${type}`">
      <canvas ref="canvasRef" role="img" :aria-label="summary" />
    </div>
    <details class="chart__table">
      <summary>以表格檢視</summary>
      <table>
        <caption class="visually-hidden">
          {{
            tableCaption
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ labelHeader }}</th>
            <th scope="col">數量（{{ unit }}）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(label, index) in labels" :key="label">
            <th scope="row">{{ label }}</th>
            <td>{{ values[index] }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>

<style scoped lang="scss">
.chart {
  display: flex;
  flex-direction: column;
  gap: space(3);

  &__canvas {
    position: relative;
    height: 260px;

    &--bar {
      height: 220px;
    }
  }

  &__table {
    font-size: rem(14px);

    summary {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      color: color('text-link');
      cursor: pointer;
    }

    table {
      width: 100%;
      margin-top: space(2);
      border-collapse: collapse;
    }

    th,
    td {
      padding: space(2);
      border-bottom: 1px solid color('border-subtle');
      text-align: left;
      font-weight: 400;
    }

    thead th {
      font-weight: 700;
    }

    td {
      font-family: var(--font-mono);
      text-align: right;
    }
  }
}
</style>
