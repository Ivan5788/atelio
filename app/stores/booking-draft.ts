/**
 * 預約流程的草稿（F-21）：三個步驟共用，切換步驟或送出失敗重試時資料不會遺失。
 * 只放在記憶體，不寫入 localStorage：聯絡資料屬於個資，不應留在瀏覽器裡。
 */
import { defineStore } from 'pinia'

export const useBookingDraftStore = defineStore('booking-draft', () => {
  const workshopSlug = ref('')
  const sessionId = ref('')
  const quantity = ref(1)
  const contact = reactive({ name: '', phone: '', note: '' })

  /** 從詳細頁帶入選擇；換了工作坊才重設，回到同一堂課時保留已填的資料 */
  function start(slug: string, initial: { sessionId?: string; quantity?: number } = {}) {
    if (workshopSlug.value !== slug) {
      workshopSlug.value = slug
      sessionId.value = ''
      quantity.value = 1
      Object.assign(contact, { name: '', phone: '', note: '' })
    }
    if (initial.sessionId) sessionId.value = initial.sessionId
    if (initial.quantity) quantity.value = initial.quantity
  }

  function clear() {
    workshopSlug.value = ''
    sessionId.value = ''
    quantity.value = 1
    Object.assign(contact, { name: '', phone: '', note: '' })
  }

  return { workshopSlug, sessionId, quantity, contact, start, clear }
})
