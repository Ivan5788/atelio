/**
 * 速率限制器（docs/05-security.md C-05）。
 *
 * - 正式環境：@upstash/ratelimit，計數存在 Redis。Serverless 每個請求可能在不同實例執行，
 *   計數必須放在共用的外部儲存，記憶體計數在這種環境等於沒有限制。
 * - 本機（沒有 Upstash 環境變數）：使用記憶體的固定視窗計數，只為了讓開發時行為一致。
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  success: boolean
  /** 視窗重置的時間（毫秒 timestamp） */
  reset: number
}

export interface RateLimiter {
  limit(identifier: string): Promise<RateLimitResult>
}

/** 記憶體固定視窗：每個 identifier 在 windowMs 內最多 max 次 */
export function createMemoryLimiter(
  max: number,
  windowMs: number,
  now: () => number = Date.now,
): RateLimiter {
  const hits = new Map<string, { count: number; reset: number }>()
  return {
    async limit(identifier) {
      const t = now()
      // 順便清掉過期的紀錄，避免 Map 無限成長
      if (hits.size > 10_000) {
        for (const [key, entry] of hits) if (entry.reset <= t) hits.delete(key)
      }
      const entry = hits.get(identifier)
      if (!entry || entry.reset <= t) {
        hits.set(identifier, { count: 1, reset: t + windowMs })
        return { success: true, reset: t + windowMs }
      }
      entry.count++
      return { success: entry.count <= max, reset: entry.reset }
    },
  }
}

const limiters = new Map<string, RateLimiter>()

export function getRateLimiter(name: string, max: number, windowSeconds: number): RateLimiter {
  const cacheKey = `${name}:${max}:${windowSeconds}`
  let limiter = limiters.get(cacheKey)
  if (!limiter) {
    limiter =
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
            prefix: `atelio:ratelimit:${name}`,
          })
        : createMemoryLimiter(max, windowSeconds * 1000)
    limiters.set(cacheKey, limiter)
  }
  return limiter
}
