/**
 * API 輸入驗證與錯誤格式（docs/05-security.md C-02、C-09）。
 * 所有 handler 都透過這裡驗證 body／query／params，錯誤格式統一為：
 *   { statusCode, message, data: { fieldErrors } }
 */
import type { H3Event } from 'h3'
import type { z } from 'zod'
import { toFieldErrors } from '#shared/schemas'

export function validateInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: '輸入資料有誤，請檢查後再試一次',
      data: { fieldErrors: toFieldErrors(result.error) },
    })
  }
  return result.data
}

export function validateQuery<S extends z.ZodType>(event: H3Event, schema: S): z.output<S> {
  return validateInput(schema, getQuery(event))
}

export function validateParams<S extends z.ZodType>(event: H3Event, schema: S): z.output<S> {
  return validateInput(schema, getRouterParams(event, { decode: true }))
}

export async function validateBody<S extends z.ZodType>(
  event: H3Event,
  schema: S,
): Promise<z.output<S>> {
  // readBody 解析失敗（不是合法 JSON）時也回 400，而不是 500
  const body = await readBody(event).catch(() => {
    throw createError({ statusCode: 400, message: '請求內容不是有效的 JSON' })
  })
  return validateInput(schema, body)
}

export function notFound(message = '找不到這筆資料'): never {
  throw createError({ statusCode: 404, message })
}

export function conflict(message: string, data?: Record<string, unknown>): never {
  throw createError({ statusCode: 409, message, data })
}
