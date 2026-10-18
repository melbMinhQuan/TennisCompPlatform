import { clubAdminRequest } from "./client";

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
  targetType: "FIXTURE" | "COMPETITION" | "RUBBER" | "MATCH_RESULT" | null;
  targetId: string | null;
  /** Null means unread. */
  readAt: string | null;
  createdAt: string;
};

/** GET /api/v1/club-admin/notifications: the administrator's own in-app notices, newest first. */
export function getClubAdminNotifications(signal: AbortSignal, identity?: string): Promise<ClubAdminNotification[]> {
  return clubAdminRequest("notifications", identity, signal, "We couldn’t load your notifications. Please try again.");
}

/** PATCH /api/v1/club-admin/notifications/:id/read. Answers the notice as now stored. */
export function markClubAdminNotificationRead(id: string, identity: string | undefined, signal: AbortSignal): Promise<ClubAdminNotification> {
  return clubAdminRequest(`notifications/${encodeURIComponent(id)}/read`, identity, signal, "We couldn’t mark this notification as read. Please try again.", {
    method: "PATCH",
  });
}

/** PATCH /api/v1/club-admin/notifications/read-all. Answers how many notices changed. */
export function markAllClubAdminNotificationsRead(identity: string | undefined, signal: AbortSignal): Promise<{ updated: number }> {
  return clubAdminRequest("notifications/read-all", identity, signal, "We couldn’t mark your notifications as read. Please try again.", {
    method: "PATCH",
  });
}
