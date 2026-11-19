import { toPublicUser } from '../../repositories/user-data.repository'

export default defineEventHandler(async (event) => toPublicUser(await requireUser(event)))
