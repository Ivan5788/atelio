import { idParamSchema, updateBookingSchema } from '#shared/schemas'
import { updateBookingQuantity } from '../../../services/booking.service'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = validateParams(event, idParamSchema)
  const { quantity } = await validateBody(event, updateBookingSchema)
  return updateBookingQuantity(user, id, quantity)
})
