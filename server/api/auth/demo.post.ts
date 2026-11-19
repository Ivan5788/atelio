import { createDemoAccount } from '../../services/auth.service'
import { toPublicUser } from '../../repositories/user-data.repository'

/** POST /api/auth/demo 一鍵 Demo 登入：建立一個新的獨立示範帳號並登入 */
export default defineEventHandler(async (event) => {
  const user = await createDemoAccount()
  await startSession(event, user)
  return toPublicUser(user)
})
