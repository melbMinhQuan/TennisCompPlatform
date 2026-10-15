import { useState } from "react";
import { getClubAdminNotifications } from "../api/club-admin-notifications";
import { useApiData } from "../api/useApiData";
import { markNotificationsRead, useReadNotificationIds } from "../data/club-admin-notification-reads";
import ClubAdminNotificationRow from "../components/club-admin/ClubAdminNotificationRow";
import MatchLoadState from "../components/MatchLoadState";
import { matchCardClass, matchLightButtonClass, pageClass, pageIntroClass, pageTitleClass, tabClass } from "../components/MatchesUI";

type View = "unread" | "all";

/**
 * Club administrator Notifications (US-22). Display-only: "Mark as read" updates the shared
 * in-memory read state (sidebar and dashboard too) until PATCH /api/v1/club-admin/notifications/:id/read exists.
 */
export default function ClubAdminNotificationsPage() {
  const { data, error, retry } = useApiData(getClubAdminNotifications);
  const [view, setView] = useState<View>("unread");
  const readIds = useReadNotificationIds();

  const notifications = (data ?? []).map((item) =>
    readIds.has(item.id) && !item.readAt ? { ...item, readAt: "read-on-this-page" } : item,
  );
  const unreadCount = notifications.filter((item) => item.readAt === null).length;
  const shown = view === "unread" ? notifications.filter((item) => item.readAt === null) : notifications;
  const markRead = (id: string) => markNotificationsRead([id]);
  const markAllRead = () => markNotificationsRead(notifications.map((item) => item.id));

  return (
    <div className={pageClass}>
      <header>
        <h1 className={pageTitleClass}>Notifications</h1>
        <p className={pageIntroClass}>Updates about Glen Waverley Tennis Club’s fixtures and competitions.</p>
      </header>

      {!data ? (
        <MatchLoadState error={error} retry={retry} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Choose notifications to show" className="flex w-full gap-3 min-[768px]:w-auto">
              <button type="button" aria-pressed={view === "unread"} onClick={() => setView("unread")} className={`${tabClass(view === "unread")} whitespace-nowrap px-3 min-[768px]:w-36`}>
                Unread ({unreadCount})
              </button>
              <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")} className={`${tabClass(view === "all")} whitespace-nowrap px-3 min-[768px]:w-36`}>
                All ({notifications.length})
              </button>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className={`${matchLightButtonClass} w-full min-[768px]:w-auto`}>
                Mark all as read
              </button>
            )}
          </div>

          <section className={matchCardClass} aria-label={view === "unread" ? "Unread notifications" : "All notifications"}>
            {shown.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                {view === "unread" ? "You’re all caught up. There are no unread notifications." : "No notifications yet."}
              </p>
            ) : (
              <ul>
                {shown.map((notification) => (
                  <ClubAdminNotificationRow key={notification.id} notification={notification} onOpen={markRead} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
