import { useSyncExternalStore } from "react";
import { mockClubAdminNotifications } from "./mock-club-admin-notifications";

// In-memory read state shared by the Notifications page, the sidebar badge and the dashboard tile,
// so all three show the same unread count. Resets on reload; later
// PATCH /api/v1/club-admin/notifications/:id/read will store it.
let readIds: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return readIds;
}

/** IDs of notices marked as read on this visit. */
export function useReadNotificationIds() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Marks one or more notices as read and updates every subscriber. */
export function markNotificationsRead(ids: string[]) {
  readIds = new Set([...readIds, ...ids]);
  listeners.forEach((listener) => listener());
}

/** Unread notices for the sidebar badge and dashboard tile; same sample as the Notifications page. */
export function useClubAdminUnreadCount() {
  const read = useReadNotificationIds();
  return mockClubAdminNotifications.filter((notice) => !notice.readAt && !read.has(notice.id)).length;
}
