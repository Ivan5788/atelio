/**
 * 會員相關 API：登入、個人資料、預約、收藏。
 */
import type { Booking, PublicUser, WorkshopSummary } from '#shared/types/domain'
import type { CreateBookingInput, LoginInput, ProfileInput, RegisterInput } from '#shared/schemas'
import { request } from './http'

export const accountService = {
  demoLogin: () => request<PublicUser>('/api/auth/demo', { method: 'POST' }),
  login: (body: LoginInput) => request<PublicUser>('/api/auth/login', { method: 'POST', body }),
  register: (body: RegisterInput) =>
    request<PublicUser>('/api/auth/register', { method: 'POST', body }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<PublicUser>('/api/me'),
  updateProfile: (body: ProfileInput) => request<PublicUser>('/api/me', { method: 'PATCH', body }),

  listBookings: () => request<Booking[]>('/api/me/bookings'),
  getBooking: (id: string) => request<Booking>(`/api/me/bookings/${encodeURIComponent(id)}`),
  createBooking: (body: CreateBookingInput) =>
    request<Booking>('/api/me/bookings', { method: 'POST', body }),
  updateBooking: (id: string, quantity: number) =>
    request<Booking>(`/api/me/bookings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { quantity },
    }),
  cancelBooking: (id: string) =>
    request<Booking>(`/api/me/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  listFavorites: () => request<WorkshopSummary[]>('/api/me/favorites'),
  listFavoriteSlugs: () => request<string[]>('/api/me/favorites/ids'),
  addFavorite: (slug: string) =>
    request(`/api/me/favorites/${encodeURIComponent(slug)}`, { method: 'PUT' }),
  removeFavorite: (slug: string) =>
    request(`/api/me/favorites/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
}
