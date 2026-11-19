import { slugParamSchema } from '#shared/schemas'
import { getArticle } from '../../services/catalog.service'

export default defineEventHandler((event) => {
  const { slug } = validateParams(event, slugParamSchema)
  return getArticle(slug, new Date()) ?? notFound('找不到這篇文章')
})
