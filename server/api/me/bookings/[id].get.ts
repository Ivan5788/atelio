import { idParamSchema } from '#shared/schemas'
import { getBooking } from '../../../services/booking.service'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = validateParams(event, idParamSchema)
  return getBooking(user, id)
})
