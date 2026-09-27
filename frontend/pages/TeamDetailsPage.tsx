import { useCallback, useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { getTeamDetails } from "../api/teams";
import { darkCardClass, matchCardClass, matchLightButtonClass, pageClass, pageTitleClass } from "../components/MatchesUI";
import MatchLoadState from "../components/MatchLoadState";
import { useApiData } from "../api/useApiData";

const card = `${matchCardClass} text-[#1a3049]`;
// Most members are ACTIVE, so only the unusual statuses get a badge.
const statusBadges = {
  ACTIVE: null,
  EMERGENCY: "Emergency",
  INACTIVE: "Inactive",
};

export default function TeamDetailsPage() {
  const { teamId = "" } = useParams();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus();
  }, [teamId]);
  const loadTeam = useCallback(
    (signal: AbortSignal, identity?: string) =>
      getTeamDetails(teamId, signal, identity),
    [teamId],
  );
  const { data: team, error, loading, retry } = useApiData(loadTeam);
  const members = team
    ? [...team.members].sort((a, b) => a.name.localeCompare(b.name))
    : [];
  return (
    <div className={`${pageClass} leading-[1.45]`}>
      <Link to="/dashboard/clubs" className={matchLightButtonClass}>
        ‹ My clubs &amp; associations
      </Link>
      <h1
        ref={heading}
        tabIndex={-1}
        className={`${pageTitleClass} outline-none`}
      >
        Team Details
      </h1>
      {loading || error ? (
        <MatchLoadState error={error} retry={retry} />
      ) : !team ? (
        <p className={card}>This team could not be found.</p>
      ) : (
        <>
          <section className={darkCardClass}>
            <p className="text-xs font-medium uppercase tracking-wide text-[#bacbdf]">
              {team.seasonStatus === "ACTIVE"
                ? "Current season"
                : "Past season"}
            </p>
            <h2 className="mt-2 text-2xl font-bold [overflow-wrap:anywhere]">
              {team.name}
            </h2>
            <p className="mt-2 text-sm text-[#bacbdf]">
              {team.clubName} · {team.associationName}
            </p>
            <dl className="mt-6 grid gap-4 border-t border-[#3f72af] pt-5 sm:grid-cols-3">
              {[
                ["Competition", team.competitionName],
                ["Season", team.seasonLabel],
                ["Section", team.sectionName],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-[#bacbdf]">{label}</dt>
                  <dd className="mt-1 font-semibold [overflow-wrap:anywhere]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={card} aria-labelledby="team-members-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="team-members-heading" className="text-xl font-bold">
                Team members
              </h2>
              <span className="rounded-full bg-[#eef1f5] px-3 py-1 text-sm">
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </div>
            {team.seasonStatus !== "ACTIVE" && (
              <p className="mt-2 text-sm text-muted">
                Members registered for this past season.
              </p>
            )}
            {members.length === 0 ? (
              <p className="mt-5 text-sm text-muted">
                No team members recorded yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[#dce4ee]">
                {members.map((member) => {
                  const badge = statusBadges[member.status];
                  return (
                    <li
                      key={member.id}
                      className={`flex flex-wrap items-center justify-between gap-3 px-2 py-4 ${member.isCurrentPlayer ? "rounded-lg bg-[#f0f5fc]" : ""}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eef1f5] text-sm font-semibold text-[#075bc5]"
                        >
                          {member.name
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <h3 className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                          {member.name}
                          {member.isCurrentPlayer && (
                            <span className="ml-2 rounded-full bg-[#1a3049] px-2 py-0.5 text-xs font-medium text-white">
                              You
                            </span>
                          )}
                        </h3>
                      </div>
                      {badge && (
                        <span className="rounded-md bg-[#eef1f5] px-3 py-1.5 text-xs font-medium text-muted">
                          {badge}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
