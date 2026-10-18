import { Link } from "react-router";
import type { ClubAdminDashboardData } from "../../api/club-admin-dashboard";
import { formatResultDate, melbourneDate } from "../../utils/date-helpers";
import { matchCardClass, matchLightButtonClass } from "../MatchesUI";

type Props = { activity: ClubAdminDashboardData["activity"] };

/** Latest recorded result activity across the club's seasons. */
export default function DashboardRecentActivity({ activity }: Props) {
  return (
    <section className={matchCardClass} aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="text-lg font-semibold">
        Recent activity
      </h2>
      <p className="mt-2 text-xs leading-5 text-muted">Recorded result activity across your club’s seasons.</p>

      {activity.map((item) => (
        <div key={item.id} className="mt-3 border-t border-slate-200 pt-4">
          <p className="text-sm font-medium leading-6">{item.match}</p>
          <p className="text-sm leading-6 text-muted">{item.summary}</p>
          <p className="mt-1 text-xs text-muted">
            <time dateTime={item.date}>{formatResultDate(melbourneDate(item.date))}</time>
          </p>
        </div>
      ))}

      <div className="pt-5">
        <Link to="/club-admin/fixtures" className={matchLightButtonClass}>
          View fixtures &amp; results
        </Link>
      </div>
    </section>
  );
}
