import { useState } from "react";
import { Link } from "react-router";
import { clubAdminUnreadCount, dashboardSeasonSummary, type ClubAdminDashboardData } from "../../data/club-admin-dashboard";
import { matchButtonClass, matchCardClass, matchLightButtonClass } from "../MatchesUI";
import ClubSummaryCard from "./ClubSummaryCard";

const actions = [
  { title: "Add a player", description: "Search the registry first, then link the right player to your club.", label: "+ Add a player", to: "/club-admin/players" },
  { title: "Create a team", description: "Choose the competition, season and section for your team.", label: "+ Create team", to: "/club-admin/teams" },
  { title: "Build a squad", description: "Select eligible, active club members and assign a team manager.", label: "Go to Teams", to: "/club-admin/teams" },
];

/** Everything below the page title: club summary, quick actions, to-do list, teams and recent activity. */
export default function ClubAdminDashboardContent({ data }: { data: ClubAdminDashboardData }) {
  const [seasonId, setSeasonId] = useState(data.seasons.find((season) => season.status === "ACTIVE")?.id ?? data.seasons[0]?.id ?? "");
  const season = data.seasons.find((item) => item.id === seasonId);
  const { teams, attention } = dashboardSeasonSummary(data, seasonId);

  return (
    <>
      <ClubSummaryCard
        data={data}
        seasonId={seasonId}
        onSeasonChange={setSeasonId}
        teamCount={teams.length}
        attentionCount={attention.length}
        unreadCount={clubAdminUnreadCount}
      />

      <section aria-label="Quick actions" className="grid gap-5 lg:grid-cols-3">
        {actions.map((action, index) => <article key={action.title} className={`${matchCardClass} flex flex-col items-start gap-3`}><h2 className="text-lg font-semibold">{action.title}</h2><p className="flex-1 text-sm leading-6 text-muted">{action.description}</p><Link to={action.to} className={index === 0 ? matchButtonClass : matchLightButtonClass}>{action.label}</Link></article>)}
      </section>

      <section className={matchCardClass} aria-labelledby="todo-heading">
        <h2 id="todo-heading" className="text-lg font-semibold">To do ({attention.length})</h2>
        {attention.length === 0 ? <p className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-6 text-muted">{season?.status === "ACTIVE" ? <><span className="rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#197354]">All set</span>Nothing needs your attention. Every {season.label} team has a team manager and players.</> : "Past seasons are shown for reference only."}</p> : attention.map((team) => <div key={team.id} className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4"><div className="min-w-0 flex-1"><h3 className="font-semibold">{team.name}</h3><p className="mt-1 text-sm text-muted">{team.competition} · {season?.label} · {team.section}</p><p className="mt-1 text-sm text-muted">{!team.managerName ? "No team manager assigned." : ""} {team.squadCount === 0 ? "No active squad players." : ""}</p></div><span className="rounded-md bg-[#fff4e5] px-2.5 py-1 text-xs font-semibold text-[#8a4b00]">Needs attention</span><Link to="/club-admin/teams" className={matchLightButtonClass}>Review team</Link></div>)}
      </section>

      <section className={matchCardClass} aria-labelledby="teams-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="teams-heading" className="text-lg font-semibold">Your teams · {season?.label}</h2><Link to="/club-admin/teams" className="text-sm text-brand underline underline-offset-4">View all teams</Link></div>
        {teams.map((team) => <article key={team.id} className="mt-4 border-t border-slate-200 pt-4"><h3 className="font-semibold">{team.name}</h3><p className="mt-1 text-sm leading-6 text-muted">{team.competition} · {team.section} · {team.squadCount} active squad players</p><p className="text-sm leading-6 text-muted">Manager: {team.managerName ?? "Not assigned"}</p></article>)}
      </section>

      {/* Unread notices are counted in the summary card and the sidebar, so there is no separate notices card. */}
      <section className={matchCardClass} aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-lg font-semibold">Recent activity</h2>
        <p className="mt-2 text-xs leading-5 text-muted">Recorded result activity across your club’s seasons.</p>
        {data.activity.map((item) => <div key={item.id} className="mt-3 border-t border-slate-200 pt-4"><p className="text-sm font-medium leading-6">{item.match}</p><p className="text-sm leading-6 text-muted">{item.summary}</p><p className="mt-1 text-xs text-muted"><time dateTime={item.date}>{new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", dateStyle: "medium" }).format(new Date(item.date))}</time></p></div>)}
        <div className="pt-5"><Link to="/club-admin/fixtures" className={matchLightButtonClass}>View fixtures &amp; results</Link></div>
      </section>
      <p className="text-sm text-white/85 md:text-muted">Need help with the next step? <Link to="/club-admin/support" className="rounded underline underline-offset-4">Visit Help &amp; Support</Link>.</p>
    </>
  );
}
