import { idParamSchema } from '#shared/schemas'
import { cancelBooking } from '../../../services/booking.service'

/** DELETE /api/me/bookings/:id 取消預約（軟刪除，狀態改為 cancelled） */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = validateParams(event, idParamSchema)
  return cancelBooking(user, id)
})
