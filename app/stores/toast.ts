/**
 * Toast 操作回饋（F-41）。
 * 顯示 5 秒後自動消失；滑鼠移入或鍵盤聚焦時暫停（BaseToastRegion 處理），
 * 讓閱讀較慢的使用者也來得及看完（WCAG 2.2.1 時間可調整）。
 */
import { defineStore } from 'pinia'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

export const TOAST_DURATION_MS = 5000
const MAX_VISIBLE = 3

export const useToastStore = defineStore('toast', () => {
  const items = ref<Toast[]>([])
  let nextId = 1

  function push(message: string, tone: ToastTone = 'success') {
    const toast = { id: nextId++, tone, message }
    // 同時最多顯示 3 則，避免連續操作時把畫面蓋滿
    items.value = [...items.value, toast].slice(-MAX_VISIBLE)
    return toast.id
  }

  function dismiss(id: number) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  return {
    items,
    push,
    dismiss,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
  }
})
