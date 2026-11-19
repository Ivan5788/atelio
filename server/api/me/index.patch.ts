import { profileSchema } from '#shared/schemas'
import { saveUser, toPublicUser } from '../../repositories/user-data.repository'

/** PATCH /api/me 更新個人資料（Email 不開放修改，避免索引 key 不一致） */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = await validateBody(event, profileSchema)
  const updated = {
    ...user,
    name: input.name,
    phone: input.phone || undefined,
    interests: input.interests,
  }
  await saveUser(updated)
  // Session 裡也存了名字，一併更新，Header 才會顯示新名字
  await startSession(event, updated)
  return toPublicUser(updated)
})
