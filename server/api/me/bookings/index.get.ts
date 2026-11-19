import { listBookings } from '../../../services/booking.service'

export default defineEventHandler(async (event) => listBookings(await requireUser(event)))
