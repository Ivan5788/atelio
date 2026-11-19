import { slugParamSchema } from '#shared/schemas'
import { getFavorites, saveFavorites } from '../../../repositories/user-data.repository'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { slug } = validateParams(event, slugParamSchema)
  const slugs = await getFavorites(user)
  if (slugs.includes(slug))
    await saveFavorites(
      user,
      slugs.filter((s) => s !== slug),
    )
  return { slug, favorited: false }
})
