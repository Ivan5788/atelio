import { getFavorites } from '../../../repositories/user-data.repository'

/** GET /api/me/favorites/ids 只回傳 slug 清單，讓卡片上的愛心可以快速顯示狀態 */
export default defineEventHandler(async (event) => getFavorites(await requireUser(event)))
