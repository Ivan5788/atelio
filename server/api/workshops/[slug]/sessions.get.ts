import { slugParamSchema } from '#shared/schemas'
import { getWorkshop } from '../../../services/catalog.service'
import { bookedSeatsBySession } from '../../../services/booking.service'
import { getBookings } from '../../../repositories/user-data.repository'

/**
 * GET /api/workshops/:slug/sessions
 * 場次與剩餘名額（已扣除目前使用者自己的預約）。只在瀏覽器端呼叫，回應不快取（/api/** no-store）。
 */
export default defineEventHandler(async (event) => {
  const { slug } = validateParams(event, slugParamSchema)
  const user = await getOptionalUser(event)
  const booked = user ? bookedSeatsBySession(await getBookings(user)) : undefined
  const workshop = getWorkshop(slug, new Date(), booked) ?? notFound('找不到這堂工作坊')
  return workshop.sessions
})
