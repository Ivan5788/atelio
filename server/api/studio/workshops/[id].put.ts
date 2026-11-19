import { idParamSchema, studioWorkshopSchema } from '#shared/schemas'
import { updateStudioWorkshop } from '../../../services/studio.service'

/** PUT /api/studio/workshops/:id 完整更新（編輯表單送出整份資料） */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = validateParams(event, idParamSchema)
  const input = await validateBody(event, studioWorkshopSchema)
  return updateStudioWorkshop(user, id, input)
})
