import type { BestUtrRank, DashboardData, NotificationItem, Page } from '../../backend/src/dashboard/dashboard.types'
import { request } from './client'
export type { BestUtrRank, DashboardData, NotificationItem, Page }

const ALL_NOTIFICATIONS_LIMIT = '100'

/** Every in-app notification for the player (newest first), for the card's View All. */
export async function getNotifications(email: string, signal: AbortSignal) {
  const query = new URLSearchParams({ email, limit: ALL_NOTIFICATIONS_LIMIT })
  return (await request<{ data: Page<NotificationItem> & { unreadCount: number | null } }>(`/api/v1/player-dashboard/notifications?${query}`, signal)).data
}

/**
 * Checks the email and password. On success /auth/login also returns the account's unrevoked
 * RoleType (e.g. 'CLUB_ADMIN', 'PLAYER') as `role`, or null, plus that role's `clubId` and `clubName`
 * (null when the role has no club) and the profile's `displayName`; see api/user-role.ts.
 */
export async function login(email: string, password: string, signal: AbortSignal) {
  const response = await request<{ result: 'login_success' | 'login_failed'; role?: string | null; clubId?: string | null; clubName?: string | null; displayName?: string | null }>('/auth/login', signal, { email, password })
  if (response.result !== 'login_success' && response.result !== 'login_failed') throw new Error('The login server returned an unexpected response.')
  return response
}

export async function getDashboard(email: string, signal: AbortSignal) {
  const query = new URLSearchParams({ email })
  return (await request<{ data: DashboardData }>(`/api/v1/player-dashboard?${query}`, signal)).data
}
