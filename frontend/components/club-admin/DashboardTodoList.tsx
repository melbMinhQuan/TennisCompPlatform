import { Link } from "react-router";
import type { ClubAdminDashboardData } from "../../api/club-admin-dashboard";
import { matchCardClass, matchLightButtonClass } from "../MatchesUI";

type Team = ClubAdminDashboardData["teams"][number];
type Season = ClubAdminDashboardData["seasons"][number];

type Props = { attention: Team[]; season: Season | undefined };

/** Teams in the selected active season that are missing a manager or players. */
export default function DashboardTodoList({ attention, season }: Props) {
  return (
    <section className={matchCardClass} aria-labelledby="todo-heading">
      <h2 id="todo-heading" className="text-lg font-semibold">
        To do ({attention.length})
      </h2>

      {attention.length === 0 ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-6 text-muted">
          {season?.status === "ACTIVE" ? (
            <>
              <span className="rounded-md bg-[#e5f4ec] px-2.5 py-1 text-xs font-semibold text-[#197354]">All set</span>
              Nothing needs your attention. Every {season.label} team has a team manager and players.
            </>
          ) : (
            "Past seasons are shown for reference only."
          )}
        </p>
      ) : (
        attention.map((team) => (
          <div key={team.id} className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{team.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {team.competition} · {season?.label} · {team.section}
              </p>
              <p className="mt-1 text-sm text-muted">
                {[!team.managerName && "No team manager assigned.", team.squadCount === 0 && "No active squad players."]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            </div>
            <span className="rounded-md bg-[#fff4e5] px-2.5 py-1 text-xs font-semibold text-[#8a4b00]">Needs attention</span>
            <Link to={`/club-admin/teams/${team.id}`} className={matchLightButtonClass}>
              Review team
            </Link>
          </div>
        ))
      )}
    </section>
  );
}
