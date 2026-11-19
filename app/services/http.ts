/**
 * API 呼叫的共同處理（ADR-004）：元件不直接呼叫 $fetch，一律經過 services/。
 * 好處：錯誤格式統一轉成 ApiError，元件只需要處理一種錯誤型別；
 * 將來後端改成獨立服務時，只需要改這一層。
 */
import { FetchError } from 'ofetch'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly fieldErrors: Record<string, string> = {},
    public readonly data: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isNetworkError() {
    return this.statusCode === 0
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof FetchError) {
    const body = (error.data ?? {}) as {
      message?: string
      data?: { fieldErrors?: Record<string, string> } & Record<string, unknown>
    }
    // 沒有 status 代表請求根本沒送到伺服器（離線、DNS 失敗）
    if (!error.status) return new ApiError('網路連線異常，請確認連線後再試一次', 0)
    return new ApiError(
      body.message || '發生錯誤，請稍後再試',
      error.status,
      body.data?.fieldErrors ?? {},
      body.data ?? {},
    )
  }
  return new ApiError('發生未預期的錯誤，請稍後再試', 500)
}

type Options = NitroFetchOptions<NitroFetchRequest>

/**
 * 發送請求並把錯誤轉成 ApiError。
 * useRequestFetch：在伺服器渲染時會轉送使用者的 Cookie；在瀏覽器中等同 $fetch。
 */
export async function request<T>(url: string, options: Options = {}): Promise<T> {
  try {
    return (await useRequestFetch()(url, options as never)) as T
  } catch (error) {
    throw toApiError(error)
  }
}
