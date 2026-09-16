import { BadRequestException } from '@nestjs/common'
import { createHash } from 'node:crypto'
import type { Page } from './dashboard.types'

export function invalidQuery(message: string): never {
  throw new BadRequestException({ statusCode: 400, code: 'INVALID_QUERY', message })
}

function stringValue(query: Record<string, unknown>, key: string): string | undefined {
  const value = query[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string') invalidQuery(`${key} must be a single string`)
  return value
}

export function parseQuery(query: Record<string, unknown>) {
  const email = (stringValue(query, 'email') ?? '').trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    invalidQuery('A valid email is required')
  }
  const rawLimit = stringValue(query, 'limit') ?? '20'
  if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 100) {
    invalidQuery('limit must be an integer between 1 and 100')
  }
  const date = (key: string) => {
    const value = stringValue(query, key)
    if (value !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) {
      invalidQuery(`${key} must be a valid YYYY-MM-DD date`)
    }
    return value
  }
  const from = date('from'), to = date('to')
  if (from && to && from > to) invalidQuery('from must be on or before to')
  const scope = stringValue(query, 'scope') ?? 'upcoming'
  if (scope !== 'upcoming' && scope !== 'all') invalidQuery('scope must be upcoming or all')
  const competitionId = stringValue(query, 'competitionId')
  if (competitionId !== undefined && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(competitionId)) {
    invalidQuery('competitionId must be a UUID')
  }
  const cursor = stringValue(query, 'cursor')
  if (cursor !== undefined && (!cursor || cursor.length > 2048)) invalidQuery('Invalid cursor')
  const discipline = stringValue(query, 'discipline') ?? 'SINGLES'
  if (discipline !== 'SINGLES' && discipline !== 'DOUBLES') invalidQuery('Invalid discipline')
  return { email, limit: Number(rawLimit), from, to, scope, competitionId, cursor, discipline }
}
export type DashboardQuery = ReturnType<typeof parseQuery>

/** Cursor belongs to one player/list/filter set; it is pagination, not authorization. */
export function paginate<T extends { id: string }>(items: T[], limit: number, context: unknown, cursor?: string): Page<T> {
  const key = createHash('sha256').update(JSON.stringify(context)).digest('hex')
  let start = 0
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
      const index = items.findIndex(item => item.id === decoded.id)
      if (decoded.key !== key || index < 0) invalidQuery('Cursor does not match this list; reload the first page')
      start = index + 1
    } catch {
      invalidQuery('Invalid cursor; reload the first page')
    }
  }
  const page = items.slice(start, start + limit)
  const hasMore = start + page.length < items.length
  return {
    available: true, items: page, hasMore,
    nextCursor: hasMore ? Buffer.from(JSON.stringify({ key, id: page[page.length - 1].id })).toString('base64url') : null,
  }
}

export function calendarDate(date: Date | null) { return date?.toISOString().slice(0, 10) ?? null }

export function melbourneToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(value => value.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function ageOn(birth: string, today: string) {
  return Number(today.slice(0, 4)) - Number(birth.slice(0, 4)) - (today.slice(5) < birth.slice(5) ? 1 : 0)
}

export function inDateRange(date: string | null, query: DashboardQuery) {
  if (!query.from && !query.to) return true
  return date !== null && (!query.from || date >= query.from) && (!query.to || date <= query.to)
}

export function compareDates(a: string | null, b: string | null, descending = false) {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return (descending ? -1 : 1) * a.localeCompare(b)
}
