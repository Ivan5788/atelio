import { idParamSchema } from '#shared/schemas'
import { getStudioWorkshop } from '../../../services/studio.service'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = validateParams(event, idParamSchema)
  return getStudioWorkshop(user, id)
})
