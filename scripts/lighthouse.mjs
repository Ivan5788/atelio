/**
 * Lighthouse 量測（Phase 6）：對本機正式版建置執行，行動版模擬（Moto G Power、慢速 4G、4 倍 CPU 減速）。
 *
 * 用法：
 *   npm run build
 *   NUXT_APP_SECRET=<任意 32 字元以上字串> PORT=3100 node .output/server/index.mjs   # 另開一個終端機
 *   npm run audit:lighthouse            # 未壓縮（node 預覽伺服器不壓縮動態回應）
 *   npm run audit:lighthouse -- --br    # 經過本機 brotli 代理，模擬 CDN 壓縮（較接近 Vercel）
 *
 * 需要 Chrome：預設使用 Playwright 安裝的 Chromium（npx playwright install chromium）。
 * 報告輸出到 reports/lighthouse/（已列入 .gitignore）。
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import http from 'node:http'
import zlib from 'node:zlib'
import { chromium } from '@playwright/test'

const TARGET = 'http://localhost:3100'
const PROXY_PORT = 3200
const useBrotli = process.argv.includes('--br')
const pages = {
  home: '/',
  list: '/workshops',
  detail: '/workshops/wheel-throwing-basics-taipei',
  category: '/categories/ceramics',
  article: '/journal/first-pottery-class-checklist',
  faq: '/faq',
}

/** 本機壓縮代理：只對文字內容做 brotli，不快取 */
function startProxy() {
  const TEXT = /text\/|javascript|json|xml|svg|css/
  const server = http.createServer(async (req, res) => {
    const headers = { ...req.headers, host: 'localhost:3100', 'accept-encoding': 'identity' }
    const upstream = await fetch(TARGET + req.url, {
      method: req.method,
      headers,
      redirect: 'manual',
    })
    const out = {}
    upstream.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k))
        out[k] = v
    })
    const body = Buffer.from(await upstream.arrayBuffer())
    const type = upstream.headers.get('content-type') || ''
    if (
      TEXT.test(type) &&
      /\bbr\b/.test(req.headers['accept-encoding'] || '') &&
      body.length > 1024
    ) {
      const compressed = zlib.brotliCompressSync(body, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 },
      })
      res.writeHead(upstream.status, {
        ...out,
        'content-encoding': 'br',
        'content-length': compressed.length,
      })
      res.end(compressed)
    } else {
      res.writeHead(upstream.status, { ...out, 'content-length': body.length })
      res.end(body)
    }
  })
  return new Promise((resolve) => server.listen(PROXY_PORT, () => resolve(server)))
}

/**
 * 非同步執行子程序。不能用 spawnSync：它會凍結事件迴圈，同一個程序裡的壓縮代理就無法回應 Lighthouse 的請求（實測會卡住）。
 */
function run(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: true, env, stdio: 'ignore' })
    child.on('close', (status) => resolve({ status }))
  })
}

const proxy = useBrotli ? await startProxy() : null
const base = useBrotli ? `http://localhost:${PROXY_PORT}` : TARGET
const outDir = `reports/lighthouse/${useBrotli ? 'brotli' : 'raw'}`
mkdirSync(outDir, { recursive: true })
const chromePath = process.env.CHROME_PATH || chromium.executablePath()

console.log(`Lighthouse（行動版）${useBrotli ? '＋ brotli 代理' : '未壓縮'} → ${outDir}\n`)
for (const [name, path] of Object.entries(pages)) {
  const result = await run(
    'npx',
    [
      '-y',
      'lighthouse@12.8.2',
      base + path,
      '--quiet',
      '"--chrome-flags=--headless=new --no-sandbox"',
      '--output=json',
      '--output=html',
      `--output-path=${outDir}/${name}`,
      '--only-categories=performance,accessibility,best-practices,seo',
    ],
    { ...process.env, CHROME_PATH: chromePath },
  )
  if (result.status !== 0) {
    console.log(`${name.padEnd(9)} 執行失敗（exit ${result.status}）`)
    continue
  }
  const report = JSON.parse(readFileSync(`${outDir}/${name}.report.json`, 'utf8'))
  const score = (key) => String(Math.round(report.categories[key].score * 100)).padStart(3)
  const metric = (id) => report.audits[id].displayValue
  console.log(
    `${name.padEnd(9)} 效能 ${score('performance')}  無障礙 ${score('accessibility')}  最佳做法 ${score('best-practices')}  SEO ${score('seo')}  | LCP ${metric('largest-contentful-paint')}  CLS ${metric('cumulative-layout-shift')}  TBT ${metric('total-blocking-time')}`,
  )
}
proxy?.close()
