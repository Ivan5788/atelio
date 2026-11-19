import { createBookingSchema } from '#shared/schemas'
import { createBooking } from '../../../services/booking.service'

/** POST /api/me/bookings 建立預約。名額不足回 409；金額由伺服器計算 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = await validateBody(event, createBookingSchema)
  const booking = await createBooking(user, input)
  setResponseStatus(event, 201)
  return booking
})
