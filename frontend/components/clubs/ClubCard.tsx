import { useState } from "react";
import { Link } from "react-router";
import type { MembershipTeam } from "../../api/memberships";
import MembershipBadge from "./MembershipBadge";
import { CLUB_CARD_CLASS, membershipDetail, pastLabel, type ClubMembership } from "./membership-helpers";

/** One club membership: badge, the first two team chips, and an expandable list of all its teams. */
export default function ClubCard({ club, teams }: { club: ClubMembership; teams: MembershipTeam[] }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = "teams-" + club.id;
  return (
    <article className={CLUB_CARD_CLASS}>
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold [overflow-wrap:anywhere]">{club.name}</h3>
          <p className="mt-1 text-[13px] text-muted">{membershipDetail(club)}</p>
        </div>
        <MembershipBadge primary={club.isPrimary} kind="CLUB" />
      </div>
      <p className="mb-1.5 mt-4 text-[10px] font-medium text-muted">MY TEAMS</p>
      {teams.length ? (
        <ul className="flex flex-wrap gap-2">
          {teams.slice(0, 2).map((team) => (
            <li
              key={team.id}
              className={`max-w-full rounded-2xl px-2.5 py-1 text-xs [overflow-wrap:anywhere] ${team.seasonStatus === "ACTIVE" ? "bg-[#eef1f5] text-[#2868ad]" : "bg-slate-100 text-slate-600"}`}
            >
              {team.name} · {team.competitionName} {team.seasonLabel}
              {pastLabel(team)}
            </li>
          ))}
          {teams.length > 2 && <li className="px-2 py-1 text-xs text-muted">+{teams.length - 2} more</li>}
        </ul>
      ) : (
        <p className="text-sm text-muted">No teams recorded for this club yet.</p>
      )}
      {teams.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex min-h-11 w-full items-center justify-end gap-1 bg-[#f0f5fc] px-5 text-sm font-medium text-[#075bc5] hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
          >
            {expanded ? "Hide Teams" : "View Teams"} <span aria-hidden="true">{expanded ? "▴" : "▾"}</span>
            <span className="sr-only"> for {club.name}</span>
          </button>
          <div id={panelId} hidden={!expanded}>
            <ul className="mt-3 divide-y divide-[#dce4ee]">
              {teams.map((team) => (
                <li key={team.id} className="text-sm [overflow-wrap:anywhere]">
                  <Link
                    to={`/dashboard/clubs/teams/${encodeURIComponent(team.id)}`}
                    className="block rounded-lg px-2 py-4 hover:bg-[#f0f5fc] focus-visible:outline-2 focus-visible:outline-[#3f72af]"
                  >
                    <p className="font-semibold">{team.name}</p>
                    <p className="mt-1 text-muted">
                      {team.competitionName} · {team.seasonLabel} · {team.sectionName}
                      {pastLabel(team)}
                    </p>
                    <span className="mt-3 inline-block font-medium text-[#075bc5]">
                      View team members <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </article>
  );
}
