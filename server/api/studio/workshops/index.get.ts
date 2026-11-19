import { studioListQuerySchema } from '#shared/schemas'
import { listStudioWorkshops } from '../../../services/studio.service'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return listStudioWorkshops(user, validateQuery(event, studioListQuerySchema))
})
