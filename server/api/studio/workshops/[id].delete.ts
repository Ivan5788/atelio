import { idParamSchema } from '#shared/schemas'
import { deleteStudioWorkshop } from '../../../services/studio.service'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = validateParams(event, idParamSchema)
  await deleteStudioWorkshop(user, id)
  setResponseStatus(event, 204)
  return null
})
