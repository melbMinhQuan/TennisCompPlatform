const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MAX_RELATIVE_DAYS = 30;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Just now", "10m ago", "3h ago", "8d ago"; older than a month shows "17 Sep 2026". */
export function timeAgo(isoTimestamp: string, now = Date.now()) {
  const elapsed = Math.max(0, now - new Date(isoTimestamp).getTime());
  if (elapsed < MINUTE_MS) return "Just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  if (elapsed < MAX_RELATIVE_DAYS * DAY_MS) return `${Math.floor(elapsed / DAY_MS)}d ago`;
  // Only the day/month/year numbers come from Intl: its month names differ between
  // locales and ICU versions ("Sept", "July"), so the name comes from SHORT_MONTHS.
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Australia/Melbourne", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date(isoTimestamp));
  const part = (type: string) => Number(parts.find((value) => value.type === type)?.value);
  return `${part("day")} ${SHORT_MONTHS[part("month") - 1]} ${part("year")}`;
}

/** "Sep 26" from YYYY-MM-DD, without shifting the calendar day through a time zone. */
function shortDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${SHORT_MONTHS[month - 1]} ${day}`;
}

/**
 * "Sep 26 → Sep 27, 2026" for a rescheduled match, or "Sep 26 → Date to be confirmed" when
 * it was postponed without a new date. Null when the notification carries no dates.
 */
export function formatDateChange(details: Record<string, unknown> | null) {
  const previous = typeof details?.previousDate === "string" ? details.previousDate : null;
  const next = typeof details?.newDate === "string" ? details.newDate : null;
  if (!previous && !next) return null;
  const to = next ? `${shortDate(next)}, ${next.slice(0, 4)}` : "Date to be confirmed";
  return previous ? `${shortDate(previous)} → ${to}` : to;
}

/**
 * "Round 13" for a numbered round, or the finals label ("Grand Final"), which has no number.
 * A numbered round is never renamed: round 5 is not a "Round of 32".
 */
export function formatRound({ round, roundLabel }: { round: number | null; roundLabel?: string | null }) {
  if (roundLabel) return roundLabel;
  return round === null ? "Round to be confirmed" : `Round ${round}`;
}
