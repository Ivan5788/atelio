import { workshopQuerySchema } from '#shared/schemas'
import { listWorkshops } from '../../services/catalog.service'

/** GET /api/workshops?q&category&city&level&priceMin&priceMax&dateFrom&sort&page&pageSize */
export default defineEventHandler((event) => {
  const query = validateQuery(event, workshopQuerySchema)
  return listWorkshops(query, new Date())
})
