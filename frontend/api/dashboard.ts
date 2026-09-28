import type { DashboardData, NotificationItem, Page, ResultItem, ScheduleItem } from '../../backend/src/dashboard/dashboard.types'
import { request } from './client'
export type { DashboardData, NotificationItem, Page, ResultItem, ScheduleItem }

const ALL_NOTIFICATIONS_LIMIT = '100'

/** Every in-app notification for the player (newest first), for the card's View All. */
export async function getNotifications(email: string, signal: AbortSignal) {
  const query = new URLSearchParams({ email, limit: ALL_NOTIFICATIONS_LIMIT })
  return (await request<{ data: Page<NotificationItem> & { unreadCount: number | null } }>(`/api/v1/player-dashboard/notifications?${query}`, signal)).data
}

export async function login(email: string, password: string, signal: AbortSignal) {
  const response = await request<{ result: 'login_success' | 'login_failed' }>('/auth/login', signal, { email, password })
  if (response.result !== 'login_success' && response.result !== 'login_failed') throw new Error('The login server returned an unexpected response.')
  return response
}

export async function getDashboard(email: string, signal: AbortSignal) {
  const query = new URLSearchParams({ email })
  return (await request<{ data: DashboardData }>(`/api/v1/player-dashboard?${query}`, signal)).data
}

export async function getMatches(email: string, view: 'schedule' | 'results', signal: AbortSignal, cursor?: string) {
  const query = new URLSearchParams({ email, limit: '10' })
  if (view === 'schedule') query.set('scope', 'all')
  if (cursor) query.set('cursor', cursor)
  return (await request<{ data: Page<ScheduleItem | ResultItem> }>(`/api/v1/player-dashboard/${view}?${query}`, signal)).data
}
