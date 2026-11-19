/**
 * 以共用的 Zod schema 驗證表單（ADR-009）：前端錯誤訊息與 API 回傳的完全相同。
 *
 * 驗證時機（避免使用者還沒輸入完就看到紅字）：
 * - 欄位離開時（blur）才驗證該欄位
 * - 已顯示錯誤的欄位，輸入時即時重新驗證，修正後錯誤立刻消失
 * - 送出時驗證全部，並把焦點移到第一個錯誤欄位
 */
import type { z } from 'zod'
import { toFieldErrors } from '#shared/schemas'

export function useZodForm<S extends z.ZodType<Record<string, unknown>>>(
  schema: S,
  initial: z.input<S>,
) {
  const values = reactive({ ...(initial as Record<string, unknown>) }) as z.input<S>
  const errors = ref<Record<string, string>>({})
  const touched = new Set<string>()

  /**
   * 按下送出按鈕時略過那一次 blur 驗證。
   * 原因（E2E 測試抓到的 bug）：滑鼠按下 → 欄位 blur → 顯示錯誤訊息把按鈕往下推 →
   * 滑鼠放開時已不在按鈕上，click 與 submit 都不會發生，使用者按了卻沒反應。
   * pointerdown 早於 blur，在這裡記下「正要按送出」，送出時本來就會驗證全部欄位。
   */
  let submitIntent = false
  function onPointerDown(event: PointerEvent) {
    submitIntent = Boolean((event.target as HTMLElement | null)?.closest('[type="submit"]'))
  }
  onMounted(() => document.addEventListener('pointerdown', onPointerDown, true))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown, true))

  function runValidation() {
    const result = schema.safeParse(values)
    return { result, fieldErrors: result.success ? {} : toFieldErrors(result.error) }
  }

  function validateField(name: string) {
    touched.add(name)
    const { fieldErrors } = runValidation()
    const { [name]: _removed, ...rest } = errors.value
    errors.value = fieldErrors[name] ? { ...rest, [name]: fieldErrors[name] } : rest
  }

  /** 輸入中：只有已經顯示錯誤的欄位才即時更新 */
  function revalidateIfShown(name: string) {
    if (errors.value[name]) validateField(name)
  }

  /** 送出前驗證全部；失敗時回傳 null 並聚焦第一個錯誤欄位 */
  function validateAll(): z.output<S> | null {
    const { result, fieldErrors } = runValidation()
    errors.value = fieldErrors
    if (result.success) return result.data
    focusFirstError()
    return null
  }

  /** 套用伺服器回傳的欄位錯誤（例如 Email 已註冊） */
  function setServerErrors(fieldErrors: Record<string, string>) {
    errors.value = { ...errors.value, ...fieldErrors }
    focusFirstError()
  }

  function focusFirstError() {
    nextTick(() => {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    })
  }

  /** 綁到 BaseInput：v-bind="field('email')" */
  function field(name: keyof z.input<S> & string) {
    return {
      error: errors.value[name],
      onBlur: () => {
        if (submitIntent) {
          submitIntent = false
          return
        }
        validateField(name)
      },
      onInput: () => revalidateIfShown(name),
    }
  }

  return { values, errors, field, validateField, validateAll, setServerErrors }
}
