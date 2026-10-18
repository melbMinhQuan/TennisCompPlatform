import { Link } from "react-router";
import type { ClubTeamSummary } from "../../../api/club-admin-teams";

/** One team on the Teams page: name, competition, season, section, squad size and manager. */
export default function ClubTeamRow({ team }: { team: ClubTeamSummary }) {
  const hasPlayers = team.squadCount > 0;

  return (
    <div className="border-b border-[#dbe4ef] py-4 last:border-b-0 md:flex md:items-center md:justify-between md:gap-4">
      <div className="min-w-0">
        <p className="font-semibold">{team.name}</p>
        <p className="mt-0.5 text-sm text-muted">
          {team.competitionName} · {team.seasonLabel} · {team.sectionName} · {team.squadCount} {team.squadCount === 1 ? "player" : "players"}
        </p>
        <p className="mt-1 text-xs text-muted">
          {team.managerName ? `Manager: ${team.managerName}` : "No manager"}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 md:mt-0 md:justify-end">
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
            hasPlayers ? "bg-[#e5f4ec] text-[#197354]" : "bg-[#fff1df] text-[#a45a15]"
          }`}
        >
          {hasPlayers ? `${team.squadCount} in squad` : "No players"}
        </span>
        <Link
          to={`/club-admin/teams/${team.id}`}
          className="text-sm font-medium text-[#3f72af] hover:underline focus-visible:outline-2 focus-visible:outline-[#3f72af]"
        >
          View ›
        </Link>
      </div>
    </div>
  );
}
