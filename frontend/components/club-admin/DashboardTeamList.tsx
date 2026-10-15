import { Link } from "react-router";
import type { ClubAdminDashboardData } from "../../data/club-admin-dashboard";
import { matchCardClass, matchLightButtonClass } from "../MatchesUI";

type Team = ClubAdminDashboardData["teams"][number];

type Props = { teams: Team[]; seasonLabel: string | undefined };

/** The club's teams in the selected season, with squad size and manager. */
export default function DashboardTeamList({ teams, seasonLabel }: Props) {
  return (
    <section className={matchCardClass} aria-labelledby="teams-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="teams-heading" className="text-lg font-semibold">
          Your teams · {seasonLabel}
        </h2>
        <Link to="/club-admin/teams" className="text-sm text-brand underline underline-offset-4">
          View all teams
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="mt-3">
          <p className="text-sm leading-6 text-muted">No teams have been entered for this season yet.</p>
          <Link to="/club-admin/teams/create" className={`${matchLightButtonClass} mt-3`}>
            + Create team
          </Link>
        </div>
      ) : (
        teams.map((team) => (
          <article key={team.id} className="mt-4 border-t border-slate-200 pt-4">
            <h3 className="font-semibold">
              <Link to={`/club-admin/teams/${team.id}`} className="underline-offset-4 hover:underline">
                {team.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              {team.competition} · {team.section} · {team.squadCount} active squad players
            </p>
            <p className="text-sm leading-6 text-muted">Manager: {team.managerName ?? "Not assigned"}</p>
          </article>
        ))
      )}
    </section>
  );
}
