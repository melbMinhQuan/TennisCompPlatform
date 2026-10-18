import { createContext, type ReactNode } from "react";
import {
  getClubAdminNotifications,
  markAllClubAdminNotificationsRead,
  markClubAdminNotificationRead,
  type ClubAdminNotification,
} from "../api/club-admin-notifications";
import { useClubAdminData } from "../api/useApiData";
import { useClubAdminAction } from "../api/useClubAdminAction";

export const ClubAdminNotificationsContext = createContext({
  /** The administrator's notices, newest first; undefined while loading or after an error. */
  notifications: undefined as ClubAdminNotification[] | undefined,
  error: undefined as string | undefined,
  retry: () => {},
  /** Unread notices; null until they have loaded. */
  unreadCount: null as number | null,
  markRead: async (_id: string) => {},
  markAllRead: async () => {},
  /** Why the last "mark as read" failed; empty when it did not. */
  markError: "",
});

/**
 * The club administrator's notices, loaded once for every club admin page: the Notifications
 * page, the sidebar badge and the dashboard's unread tile all read this, so they always agree.
 * Marking a notice read saves it (PATCH) and then updates the list from the answer.
 */
export default function ClubAdminNotifications({ children }: { children: ReactNode }) {
  const { data, error, retry, setData } = useClubAdminData(getClubAdminNotifications);
  const { run, error: markError } = useClubAdminAction();

  async function markRead(id: string) {
    const updated = await run((email, signal) => markClubAdminNotificationRead(id, email, signal));
    if (updated) setData((list) => list.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function markAllRead() {
    const readAt = new Date().toISOString();
    if (await run((email, signal) => markAllClubAdminNotificationsRead(email, signal))) {
      setData((list) => list.map((item) => (item.readAt ? item : { ...item, readAt })));
    }
  }

  const unreadCount = data ? data.filter((item) => item.readAt === null).length : null;
  return (
    <ClubAdminNotificationsContext.Provider value={{ notifications: data, error, retry, unreadCount, markRead, markAllRead, markError }}>
      {children}
    </ClubAdminNotificationsContext.Provider>
  );
}
