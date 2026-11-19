import { listArticles } from '../../services/catalog.service'

export default defineEventHandler(() => listArticles())
