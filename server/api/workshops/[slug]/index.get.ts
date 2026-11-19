import { slugParamSchema } from '#shared/schemas'
import { getWorkshop, relatedWorkshops } from '../../../services/catalog.service'

/**
 * GET /api/workshops/:slug
 * 公開資料，詳細頁以 ISR 快取，所以這裡刻意不讀取 Session：
 * 剩餘名額是「所有人看到都一樣」的版本，個人化的名額由 /sessions 端點提供。
 */
export default defineEventHandler((event) => {
  const { slug } = validateParams(event, slugParamSchema)
  const now = new Date()
  const workshop = getWorkshop(slug, now) ?? notFound('找不到這堂工作坊')
  return { workshop, related: relatedWorkshops(workshop, now) }
})
