import { Link } from "react-router";
import type { ClubAdminNotification } from "../../api/club-admin-notifications";
import { formatFixtureDate, formatTime } from "../../utils/date-helpers";
import { formatDateChange, timeAgo } from "../../utils/formatters";
import NotificationIcon from "../notifications/NotificationIcon";

// Badge text and colours per notification type; unknown types fall back to "Update".
const BADGES: Record<string, { label: string; className: string }> = {
  MATCH_DATE_CHANGED: { label: "Fixture changed", className: "bg-[#fbe9ea] text-[#a12f2f]" },
  VENUE_CHANGED: { label: "Venue changed", className: "bg-[#e8f0fa] text-[#1a3049]" },
  MATCH_REMINDER: { label: "Reminder", className: "bg-[#e5f4ec] text-[#197354]" },
  DRAW_RELEASED: { label: "Draw released", className: "bg-[#e5f4ec] text-[#197354]" },
  COMPETITION_UPDATE: { label: "Competition update", className: "bg-[#fff4e5] text-[#8a4b00]" },
};

const text = (value: unknown) => (typeof value === "string" ? value : null);

/** The extra line under the message: what changed, or when and where the match is. */
function changeLine({ type, details }: ClubAdminNotification) {
  if (type === "MATCH_DATE_CHANGED") return formatDateChange(details);
  if (type === "VENUE_CHANGED" && text(details?.newVenue)) {
    return `${text(details?.previousVenue) ?? "Previous venue"} → ${text(details?.newVenue)}`;
  }
  if (type === "MATCH_REMINDER") {
    const venue = text(details?.venue);
    return `${formatFixtureDate(text(details?.scheduledDate))} · ${formatTime(text(details?.scheduledTime))}${venue ? ` · ${venue}` : ""}`;
  }
  return null;
}

type RowProps = { notification: ClubAdminNotification; onOpen: (id: string) => void };

/** One notice: icon, unread dot, title, type badge, match, what changed, when, and a link. */
export default function ClubAdminNotificationRow({ notification, onOpen }: RowProps) {
  const unread = notification.readAt === null;
  const badge = BADGES[notification.type] ?? { label: "Update", className: "bg-slate-100 text-slate-600" };
  const change = changeLine(notification);
  const link =
    notification.targetType === "FIXTURE"
      ? { to: notification.targetId ? `/club-admin/fixtures/${notification.targetId}` : "/club-admin/fixtures", label: "View fixture ›" }
      : notification.targetType === "COMPETITION"
        ? { to: "/club-admin/teams", label: "Go to Teams ›" }
        : null;

  return (
    <li className={`flex min-w-0 gap-4 border-t border-slate-200 py-4 first:border-t-0 ${unread ? "" : "opacity-80"}`}>
      <div className="hidden shrink-0 min-[480px]:block">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {unread && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-[#3f72af]" />}
          <h3 className={`text-base leading-6 [overflow-wrap:anywhere] ${unread ? "font-semibold" : "font-medium"}`}>
            {notification.title}
            {unread && <span className="sr-only"> (unread)</span>}
          </h3>
          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
        </div>
        {notification.match && <p className="mt-1 text-sm font-medium leading-6">{notification.match}</p>}
        <p className="text-sm leading-6 text-muted [overflow-wrap:anywhere]">{notification.message}</p>
        {change && <p className="text-sm font-semibold leading-6">{change}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <time dateTime={notification.createdAt} className="text-muted">
            {timeAgo(notification.createdAt)}
          </time>
          {link && (
            <Link to={link.to} onClick={() => onOpen(notification.id)} className="font-medium text-brand underline-offset-4 hover:underline">
              {link.label}
            </Link>
          )}
          {unread && (
            <button type="button" onClick={() => onOpen(notification.id)} className="font-medium text-brand underline-offset-4 hover:underline">
              Mark as read
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
