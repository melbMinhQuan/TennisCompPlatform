import { useContext, useEffect, useRef, useState } from "react";
import { getNotifications, type NotificationItem } from "../api/dashboard";
import { PlayerSessionContext } from "../context/PlayerSession";
import NotificationRow from "./notifications/NotificationRow";

type NotificationPanelProps = {
  /** The newest few, from the dashboard response (or the logged-out sample). */
  notifications: NotificationItem[];
  /** True when the player has more than the preview shows. */
  hasMore: boolean;
};

/** Dashboard card: newest notifications, with View All loading the full list from the backend. */
export default function NotificationPanel({ notifications, hasMore }: NotificationPanelProps) {
  const { email } = useContext(PlayerSessionContext);
  const [expanded, setExpanded] = useState(false);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadingAll, setLoadingAll] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function toggleAll() {
    if (expanded) return setExpanded(false);
    setExpanded(true);
    if (!email || !hasMore || allNotifications) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoadingAll(true);
    setLoadError("");
    try {
      const page = await getNotifications(email, controller.signal);
      if (!controller.signal.aborted) setAllNotifications(page.items);
    } catch {
      if (!controller.signal.aborted) setLoadError("We couldn’t load all your notifications. Please try again.");
    } finally {
      if (!controller.signal.aborted) setLoadingAll(false);
    }
  }

  const shown = expanded && allNotifications ? allNotifications : notifications;
  const canExpand = hasMore || expanded;

  return (
    <section className="min-w-0 min-h-[360px] rounded-2xl bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-ink">Notifications</h2>

        {canExpand && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={toggleAll}
            className="shrink-0 text-sm font-semibold text-[#3f97ad] hover:underline"
          >
            {expanded ? "Show less" : "View All"}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center text-center">
          <div>
            <p className="text-base font-medium text-slate-500">No notifications</p>
            <p className="mt-2 text-sm text-slate-500">Changes to your matches will appear here.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {shown.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </ul>
      )}

      {loadingAll && (
        <p role="status" className="mt-3 text-sm text-slate-500">
          Loading all notifications…
        </p>
      )}
      {loadError && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {loadError}
        </p>
      )}
    </section>
  );
}
