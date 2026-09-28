import { Link } from "react-router";
import type { NotificationItem } from "../../api/dashboard";
import { formatDateChange, timeAgo } from "../../utils/formatters";
import NotificationIcon from "./NotificationIcon";

const ROW_CLASS = "flex min-w-0 items-start gap-4 rounded-xl py-2.5";

/** One notification: icon, title, message, old → new date for a reschedule, and how long ago. */
export default function NotificationRow({ notification }: { notification: NotificationItem }) {
  const dateChange = notification.type === "MATCH_DATE_CHANGED" ? formatDateChange(notification.details) : null;
  const content = (
    <>
      <NotificationIcon type={notification.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-base font-semibold leading-6 text-[#1a1a1a] [overflow-wrap:anywhere]">
            {notification.title}
            {notification.readAt === null && <span className="sr-only"> (unread)</span>}
          </p>
          <time dateTime={notification.createdAt} className="shrink-0 text-sm leading-6 text-[#1a1a1a]">
            {timeAgo(notification.createdAt)}
          </time>
        </div>

        <p className="text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{notification.message}</p>

        {dateChange && <p className="mt-0.5 text-sm font-semibold leading-6 text-[#1a1a1a]">{dateChange}</p>}
      </div>
    </>
  );

  // A notification about a fixture opens that fixture; anything else is informational.
  if (notification.target?.type === "FIXTURE") {
    return (
      <li>
        <Link to={`/dashboard/matches/${notification.target.id}`} className={`${ROW_CLASS} -mx-2 px-2 transition hover:bg-slate-50`}>
          {content}
        </Link>
      </li>
    );
  }
  return <li className={ROW_CLASS}>{content}</li>;
}
