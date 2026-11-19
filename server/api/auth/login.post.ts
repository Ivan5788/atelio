import { loginSchema } from '#shared/schemas'
import { login } from '../../services/auth.service'
import { toPublicUser } from '../../repositories/user-data.repository'

export default defineEventHandler(async (event) => {
  const input = await validateBody(event, loginSchema)
  const user = await login(input)
  if (!user) {
    // 不區分「帳號不存在」或「密碼錯誤」，避免被用來探測哪些 Email 註冊過（C-14）
    throw createError({ statusCode: 401, message: 'Email 或密碼錯誤' })
  }
  await startSession(event, user)
  return toPublicUser(user)
})
