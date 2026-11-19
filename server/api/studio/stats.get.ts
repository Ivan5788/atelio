import { getStudioStats } from '../../services/studio.service'

export default defineEventHandler(async (event) => getStudioStats(await requireUser(event)))
