import { mockClubAdminNotifications } from "../data/mock-club-admin-notifications";

/** One notice for the club administrator about their club's teams or competitions (US-22). */
export type ClubAdminNotification = {
  id: string;
  /** NotificationType in the database, e.g. MATCH_DATE_CHANGED, VENUE_CHANGED, MATCH_REMINDER. */
  type: string;
  title: string;
  message: string;
  /** "Round 13 · Syndal A vs Glen Waverley A" for a fixture notice; null otherwise. */
  match: string | null;
  /** Type-specific payload (old/new date, old/new venue, scheduled date and time). */
  details: Record<string, unknown> | null;
  targetType: "FIXTURE" | "COMPETITION" | null;
  targetId: string | null;
  /** Null means unread. */
  readAt: string | null;
  createdAt: string;
};

/**
 * Sample notices for the display-only Sprint 2 page.
 *
 * Planned endpoints for the API team: GET /api/v1/club-admin/notifications returning
 * { data: ClubAdminNotification[] } (IN_APP rows for the admin's own club only, newest first),
 * and PATCH /api/v1/club-admin/notifications/:id/read. Errors must not fall back to this sample.
 */
export async function getClubAdminNotifications(signal: AbortSignal): Promise<ClubAdminNotification[]> {
  signal.throwIfAborted();
  return structuredClone(mockClubAdminNotifications);
}
