import { useContext, useState } from "react";
import { Link } from "react-router";
import { dashboardSeasonSummary, defaultSeasonId, type ClubAdminDashboardData } from "../../api/club-admin-dashboard";
import { ClubAdminNotificationsContext } from "../../context/ClubAdminNotifications";
import { matchButtonClass, matchCardClass, matchLightButtonClass } from "../MatchesUI";
import ClubSummaryCard from "./ClubSummaryCard";
import DashboardRecentActivity from "./DashboardRecentActivity";
import DashboardTeamList from "./DashboardTeamList";
import DashboardTodoList from "./DashboardTodoList";

const actions = [
  {
    title: "Add a player",
    description: "Search the registry first, then link the right player to your club.",
    label: "+ Add a player",
    to: "/club-admin/players/add",
  },
  {
    title: "Create a team",
    description: "Choose the competition, season and section for your team.",
    label: "+ Create team",
    to: "/club-admin/teams/create",
  },
  {
    title: "Build a squad",
    description: "Select eligible, active club members and assign a team manager.",
    label: "Go to Teams",
    to: "/club-admin/teams",
  },
];

/** Everything below the page title: club summary, quick actions, to-do list, teams and recent activity. */
export default function ClubAdminDashboardContent({ data }: { data: ClubAdminDashboardData }) {
  const [seasonId, setSeasonId] = useState(() => defaultSeasonId(data));
  const season = data.seasons.find((item) => item.id === seasonId);
  const { teams, attention } = dashboardSeasonSummary(data, seasonId);
  // The shared list, so marking a notice read updates this tile too; the dashboard's own count until it loads.
  const unreadCount = useContext(ClubAdminNotificationsContext).unreadCount ?? data.unreadCount;

  return (
    <>
      <ClubSummaryCard
        data={data}
        seasonId={seasonId}
        onSeasonChange={setSeasonId}
        teamCount={teams.length}
        attentionCount={attention.length}
        unreadCount={unreadCount}
      />

      <section aria-label="Quick actions" className="grid gap-5 lg:grid-cols-3">
        {actions.map((action, index) => (
          <article key={action.title} className={`${matchCardClass} flex flex-col items-start gap-3`}>
            <h2 className="text-lg font-semibold">{action.title}</h2>
            <p className="flex-1 text-sm leading-6 text-muted">{action.description}</p>
            <Link to={action.to} className={index === 0 ? matchButtonClass : matchLightButtonClass}>
              {action.label}
            </Link>
          </article>
        ))}
      </section>

      <DashboardTodoList attention={attention} season={season} />
      <DashboardTeamList teams={teams} seasonLabel={season?.label} />
      {/* Unread notices are counted in the summary card and the sidebar, so there is no separate notices card. */}
      <DashboardRecentActivity activity={data.activity} />

      <p className="text-sm text-white/85 md:text-muted">
        Need help with the next step?{" "}
        <Link to="/club-admin/support" className="rounded underline underline-offset-4">
          Visit Help &amp; Support
        </Link>
        .
      </p>
    </>
  );
}
