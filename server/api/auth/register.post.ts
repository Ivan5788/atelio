import { registerSchema } from '#shared/schemas'
import { register } from '../../services/auth.service'
import { toPublicUser } from '../../repositories/user-data.repository'

export default defineEventHandler(async (event) => {
  const input = await validateBody(event, registerSchema)
  const user = await register(input)
  await startSession(event, user)
  setResponseStatus(event, 201)
  return toPublicUser(user)
})
