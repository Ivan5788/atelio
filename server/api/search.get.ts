import { searchQuerySchema } from '#shared/schemas'
import { searchAll } from '../services/catalog.service'

/** GET /api/search?q= 全站搜尋，工作坊／講師／文章分組回傳 */
export default defineEventHandler((event) => {
  const { q } = validateQuery(event, searchQuerySchema)
  return searchAll(q, new Date())
})
