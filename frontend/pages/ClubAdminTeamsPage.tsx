import { Link } from "react-router";
import { useContext, useState } from "react";
import { getClubTeams, type ClubTeamSummary } from "../api/club-admin-teams";
import { useClubAdminData } from "../api/useApiData";
import { RoleSessionContext } from "../context/RoleSession";
import ClubTeamRow from "../components/club-admin/teams/ClubTeamRow";
import HelpTopicLink from "../components/club-admin/HelpTopicLink";
import MatchLoadState from "../components/MatchLoadState";
import { matchButtonClass, matchCardClass, pageTitleClass, tabClass } from "../components/MatchesUI";
import { shortClubName } from "../utils/formatters";

type SeasonFilter = "current" | "upcoming" | "past";

/**
 * The tabs follow each season's status, so they stay right when a new season starts: the season
 * being played and the next one (named after their teams' season), then every finished season.
 */
function tabsFor(teams: ClubTeamSummary[]): { value: SeasonFilter; label: string }[] {
  const active = teams.find((team) => team.seasonStatus === "ACTIVE");
  const upcoming = teams.find((team) => team.seasonStatus === "UPCOMING");
  return [
    ...(active ? [{ value: "current" as const, label: active.seasonLabel }] : []),
    ...(upcoming ? [{ value: "upcoming" as const, label: upcoming.seasonLabel }] : []),
    { value: "past", label: "Past seasons" },
  ];
}

function inTab(team: ClubTeamSummary, filter: SeasonFilter) {
  if (filter === "current") return team.seasonStatus === "ACTIVE";
  if (filter === "upcoming") return team.seasonStatus === "UPCOMING";
  return team.seasonStatus === "COMPLETED" || team.seasonStatus === "ARCHIVED";
}

/** The club's teams by season: the season being played, the next season, and past seasons. */
export default function ClubAdminTeamsPage() {
  const [competition, setCompetition] = useState("ALL");
  const [chosenFilter, setChosenFilter] = useState<SeasonFilter | null>(null);
  // Every season's teams with squad size and manager, from the backend.
  const { data, error, retry } = useClubAdminData(getClubTeams);
  const clubName = useContext(RoleSessionContext).signedIn?.clubName ?? "Your club";

  const teams = [...(data ?? [])].sort((a, b) => a.name.localeCompare(b.name) || a.sectionName.localeCompare(b.sectionName));
  const tabs = tabsFor(teams);
  const seasonFilter = chosenFilter ?? tabs[0].value;
  const competitionNames = [...new Set(teams.map((team) => team.competitionName))].sort();

  const visibleTeams = teams.filter(
    (team) =>
      inTab(team, seasonFilter) &&
      (competition === "ALL" || team.competitionName === competition),
  );
  const tabLabel = tabs.find((tab) => tab.value === seasonFilter)?.label;

  return (
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-[#526579]">
        <span className="md:hidden">{shortClubName(clubName)} · Club Admin</span>
        <span className="hidden md:inline">Club administration&nbsp; / &nbsp;Teams</span>
      </p>

      <h1 className={`mt-5 md:mt-6 ${pageTitleClass}`}>Teams</h1>
      <p className="mt-4 text-sm leading-6 text-[#d2dfed] md:text-base md:text-muted">
        {clubName}’s teams for each season, with their section, squad and team manager.
      </p>

      <div className="mt-5 flex flex-col gap-3 md:mt-4 md:flex-row md:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
          <span>Competition</span>
          <select
            value={competition}
            onChange={(event) => setCompetition(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-[#c6d6e8] bg-white px-4 text-base text-[#1a3049] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
          >
            <option value="ALL">All competitions</option>
            {competitionNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <div role="group" aria-label="Filter teams by season" className="grid grid-cols-3 gap-2 md:flex">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={seasonFilter === tab.value}
              onClick={() => setChosenFilter(tab.value)}
              className={`${tabClass(seasonFilter === tab.value)} px-3 md:whitespace-nowrap`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Link to="/club-admin/teams/create" className={`${matchButtonClass} md:whitespace-nowrap`}>
          + Create team
        </Link>
      </div>

      {!data ? (
        <div className="mt-4">
          <MatchLoadState error={error} retry={retry} />
        </div>
      ) : (
        <div className={`mt-4 text-[#1a3049] ${matchCardClass}`}>
          <h2 className="border-b border-[#dbe4ef] pb-1 text-lg font-bold">
            {tabLabel} · {visibleTeams.length} {visibleTeams.length === 1 ? "team" : "teams"}
          </h2>
          {visibleTeams.length === 0 ? (
            <p className="py-8 text-sm text-muted">
              {seasonFilter === "upcoming"
                ? "No teams entered for this season yet. Use “Create team” to enter one."
                : "No teams found for this competition."}
            </p>
          ) : (
            visibleTeams.map((team) => <ClubTeamRow key={team.id} team={team} />)
          )}
        </div>
      )}

      <HelpTopicLink topic="teams" label="Why a new team is created each season" />
    </section>
  );
}
