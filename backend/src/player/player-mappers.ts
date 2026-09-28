import type { MatchFixture } from './player.types'

/** Fixtures without a venue are local to the association's home time zone. */
export const DEFAULT_TIME_ZONE = 'Australia/Melbourne'

/** "Chloe Cooper" from a player's name parts. */
export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim()
}

/** "Winter 2026" from Season.season_type and year; either part may be missing. */
export function seasonLabel(season: { seasonType: string | null; year: number | null }): string {
  return [season.seasonType, season.year].filter(part => part !== null && part !== '').join(' ') || 'Season to be confirmed'
}

/**
 * The player-facing name of a match format, from how many singles and doubles
 * rubbers it has, e.g. 2 singles + 1 doubles is "Team singles & doubles".
 */
export function formatLabel(format: { singlesCount: number | null; doublesCount: number | null } | null): string {
  const singles = (format?.singlesCount ?? 0) > 0
  const doubles = (format?.doublesCount ?? 0) > 0
  if (singles && doubles) return 'Team singles & doubles'
  if (singles) return 'Team singles'
  if (doubles) return 'Team doubles'
  return 'Format to be confirmed'
}

const FIXTURE_STATUS_LABELS: Record<string, MatchFixture['status']> = {
  SCHEDULED: 'Scheduled',
  POSTPONED: 'Postponed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

/** Fixture.status as the frontend spells it. */
export function fixtureStatusLabel(status: string): MatchFixture['status'] {
  return FIXTURE_STATUS_LABELS[status] ?? 'Scheduled'
}

/** YYYY-MM-DD for a @db.Date column, which Prisma returns at UTC midnight. */
export function calendarDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null
}

/** HH:mm for a @db.Time column, which Prisma returns on the epoch date. */
export function clockTime(value: Date | null): string | null {
  return value ? value.toISOString().slice(11, 16) : null
}

/** YYYY-MM-DD of an instant as seen on the wall calendar of a time zone. */
export function localDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant)
  const part = (type: string) => parts.find(value => value.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

/** Decimal columns arrive as Prisma.Decimal; the frontend expects plain numbers. */
export function decimalNumber(value: { toString(): string } | null): number | null {
  return value === null ? null : Number(value.toString())
}
