/**
 * 公開內容的 API（工作坊、分類、城市、講師、文章、搜尋）。
 * 型別來自 shared/types，與伺服器共用同一份契約。
 */
import type {
  Article,
  ArticleSummary,
  Category,
  City,
  Instructor,
  Paginated,
  Workshop,
  WorkshopSession,
  WorkshopSummary,
} from '#shared/types/domain'
import { request } from './http'

export type WorkshopListParams = Record<string, string | number | undefined>

export const catalogService = {
  listWorkshops: (query: WorkshopListParams) =>
    request<Paginated<WorkshopSummary>>('/api/workshops', { query }),

  getWorkshop: (slug: string) =>
    request<{ workshop: Workshop; related: WorkshopSummary[] }>(
      `/api/workshops/${encodeURIComponent(slug)}`,
    ),

  /** 個人化的剩餘名額，只在瀏覽器呼叫 */
  getSessions: (slug: string) =>
    request<WorkshopSession[]>(`/api/workshops/${encodeURIComponent(slug)}/sessions`),

  listCategories: () => request<Category[]>('/api/categories'),
  listCities: () => request<City[]>('/api/cities'),
  listInstructors: () => request<Instructor[]>('/api/instructors'),

  getInstructor: (slug: string) =>
    request<{ instructor: Instructor; workshops: WorkshopSummary[] }>(
      `/api/instructors/${encodeURIComponent(slug)}`,
    ),

  listArticles: () => request<ArticleSummary[]>('/api/articles'),

  getArticle: (slug: string) =>
    request<{ article: Article; related: WorkshopSummary[] }>(
      `/api/articles/${encodeURIComponent(slug)}`,
    ),

  search: (q: string) =>
    request<{
      workshops: WorkshopSummary[]
      instructors: Instructor[]
      articles: ArticleSummary[]
    }>('/api/search', { query: { q } }),
}
