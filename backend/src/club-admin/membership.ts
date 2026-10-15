import { calendarDate, DEFAULT_TIME_ZONE } from '../player/player-mappers'

/** Today as YYYY-MM-DD in the association's time zone, so it changes at Melbourne midnight. */
export function localToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TIME_ZONE }).format(now)
}

/**
 * A membership that counts today: ACTIVE, already started and not yet ended.
 * Missing dates are open on that side.
 */
export function isCurrentMembership(
  membership: { status: string; startDate: Date | null; endDate: Date | null },
  today: string,
): boolean {
  const start = calendarDate(membership.startDate)
  const end = calendarDate(membership.endDate)
  return membership.status === 'ACTIVE' && (!start || start <= today) && (!end || today <= end)
}
