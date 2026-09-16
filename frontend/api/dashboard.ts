import type { DashboardData, Page, ResultItem, ScheduleItem } from '../../backend/src/dashboard/dashboard.types'
export type { DashboardData, Page, ResultItem, ScheduleItem }

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

async function request<T>(path: string, signal: AbortSignal, body?: unknown): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST', signal,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(typeof json.message === 'string' ? json.message : `Request failed (${response.status})`)
  return json as T
}

export function login(email: string, password: string, signal: AbortSignal) {
  return request<{ result: 'login_success' | 'login_failed' }>('/auth/login', signal, { email, password })
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
