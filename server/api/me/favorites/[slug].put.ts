import { slugParamSchema } from '#shared/schemas'
import { getFavorites, saveFavorites } from '../../../repositories/user-data.repository'
import { getWorkshop } from '../../../services/catalog.service'

/** PUT /api/me/favorites/:slug 加入收藏（冪等：重複呼叫結果相同） */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { slug } = validateParams(event, slugParamSchema)
  if (!getWorkshop(slug, new Date())) notFound('找不到這堂工作坊')
  const slugs = await getFavorites(user)
  if (!slugs.includes(slug)) await saveFavorites(user, [...slugs, slug].slice(-100))
  return { slug, favorited: true }
})
