import { BadRequestException } from '@nestjs/common'
import { createHash } from 'node:crypto'
import type { DashboardQueryDto } from './dashboard-query.dto'
import type { Page } from './dashboard.types'

export function invalidQuery(message: string): never {
  throw new BadRequestException({ statusCode: 400, code: 'INVALID_QUERY', message })
}

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

export function inDateRange(date: string | null, query: DashboardQueryDto) {
  if (!query.from && !query.to) return true
  return date !== null && (!query.from || date >= query.from) && (!query.to || date <= query.to)
}

export function compareDates(left: string | null, right: string | null, descending = false) {
  if (left === null) return right === null ? 0 : 1
  if (right === null) return -1
  return (descending ? -1 : 1) * left.localeCompare(right)
}
