/**
 * Studio（開課者後台）API。
 */
import type { Paginated, StudioStats, StudioWorkshop, WorkshopStatus } from '#shared/types/domain'
import type { StudioWorkshopInput } from '#shared/schemas'
import { request } from './http'

export const studioService = {
  list: (query: Record<string, string | number | undefined>) =>
    request<Paginated<StudioWorkshop>>('/api/studio/workshops', { query }),
  get: (id: string) => request<StudioWorkshop>(`/api/studio/workshops/${encodeURIComponent(id)}`),
  create: (body: StudioWorkshopInput) =>
    request<StudioWorkshop>('/api/studio/workshops', { method: 'POST', body }),
  update: (id: string, body: StudioWorkshopInput) =>
    request<StudioWorkshop>(`/api/studio/workshops/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body,
    }),
  setStatus: (id: string, status: WorkshopStatus) =>
    request<StudioWorkshop>(`/api/studio/workshops/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status },
    }),
  remove: (id: string) =>
    request<null>(`/api/studio/workshops/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  stats: () => request<StudioStats>('/api/studio/stats'),
}
