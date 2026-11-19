import { listCategories } from '../../services/catalog.service'

export default defineEventHandler(() => listCategories())
