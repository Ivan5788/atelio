import { slugParamSchema } from '#shared/schemas'
import { getInstructor } from '../../services/catalog.service'

export default defineEventHandler((event) => {
  const { slug } = validateParams(event, slugParamSchema)
  return getInstructor(slug, new Date()) ?? notFound('找不到這位講師')
})
