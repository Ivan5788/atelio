import { getFavorites } from '../../../repositories/user-data.repository'
import { allWorkshops, toSummary } from '../../../services/catalog.service'

/** GET /api/me/favorites 收藏的工作坊（依收藏時間新到舊） */
export default defineEventHandler(async (event) => {
  const slugs = await getFavorites(await requireUser(event))
  const bySlug = new Map(allWorkshops(new Date()).map((w) => [w.slug, w]))
  return [...slugs]
    .reverse()
    .map((slug) => bySlug.get(slug))
    .filter((w) => w !== undefined)
    .map(toSummary)
})
