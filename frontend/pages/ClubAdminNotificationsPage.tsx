import { useContext, useState } from "react";
import { ClubAdminNotificationsContext } from "../context/ClubAdminNotifications";
import { RoleSessionContext } from "../context/RoleSession";
import ClubAdminNotificationRow from "../components/club-admin/ClubAdminNotificationRow";
import MatchLoadState from "../components/MatchLoadState";
import { matchCardClass, matchLightButtonClass, pageClass, pageIntroClass, pageTitleClass, tabClass } from "../components/MatchesUI";

type View = "unread" | "all";

/**
 * Club administrator Notifications (US-22). "Mark as read" and "Mark all as read" are saved by the
 * backend; the sidebar badge and the dashboard tile share this list (ClubAdminNotifications).
 */
export default function ClubAdminNotificationsPage() {
  const { notifications, error, retry, unreadCount, markRead, markAllRead, markError } = useContext(ClubAdminNotificationsContext);
  const clubName = useContext(RoleSessionContext).signedIn?.clubName ?? "your club";
  const [view, setView] = useState<View>("unread");

  const all = notifications ?? [];
  const shown = view === "unread" ? all.filter((item) => item.readAt === null) : all;

  return (
    <div className={pageClass}>
      <header>
        <h1 className={pageTitleClass}>Notifications</h1>
        <p className={pageIntroClass}>Updates about {clubName}’s fixtures and competitions.</p>
      </header>

      {!notifications ? (
        <MatchLoadState error={error} retry={retry} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Choose notifications to show" className="flex w-full gap-3 min-[768px]:w-auto">
              <button type="button" aria-pressed={view === "unread"} onClick={() => setView("unread")} className={`${tabClass(view === "unread")} whitespace-nowrap px-3 min-[768px]:w-36`}>
                Unread ({unreadCount})
              </button>
              <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")} className={`${tabClass(view === "all")} whitespace-nowrap px-3 min-[768px]:w-36`}>
                All ({all.length})
              </button>
            </div>
            {Boolean(unreadCount) && (
              <button type="button" onClick={() => void markAllRead()} className={`${matchLightButtonClass} w-full min-[768px]:w-auto`}>
                Mark all as read
              </button>
            )}
          </div>

          <section className={matchCardClass} aria-label={view === "unread" ? "Unread notifications" : "All notifications"}>
            {markError && (
              <p role="alert" className="mb-3 text-sm text-red-700">
                {markError}
              </p>
            )}
            {shown.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                {view === "unread" ? "You’re all caught up. There are no unread notifications." : "No notifications yet."}
              </p>
            ) : (
              <ul>
                {shown.map((notification) => (
                  <ClubAdminNotificationRow key={notification.id} notification={notification} onOpen={(id) => void markRead(id)} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
