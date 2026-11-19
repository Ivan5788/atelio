import { idParamSchema, studioStatusSchema } from '#shared/schemas'
import { setStudioWorkshopStatus } from '../../../services/studio.service'

/** PATCH /api/studio/workshops/:id 部分更新：目前只開放切換上架／下架 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = validateParams(event, idParamSchema)
  const { status } = await validateBody(event, studioStatusSchema)
  return setStudioWorkshopStatus(user, id, status)
})
