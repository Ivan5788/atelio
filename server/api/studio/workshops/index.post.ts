import { studioWorkshopSchema } from '#shared/schemas'
import { createStudioWorkshop } from '../../../services/studio.service'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = await validateBody(event, studioWorkshopSchema)
  setResponseStatus(event, 201)
  return createStudioWorkshop(user, input)
})
