import { Link } from "react-router";
import { useMemo, useState } from "react";
import { mockPlayers } from "../data/mock-club-admin-players";
import { clubAdminClubId, mockClubAdminDashboard } from "../data/club-admin-dashboard";
import { activeSeason, seasonOf, upcomingSeason } from "../data/club-admin-sections";
import { useTeamPlayers } from "../data/teamSquadStore";
import { useTeamManagers } from "../data/teamManagerStore";
import { useClubTeams } from "../data/teamStore";
import ClubTeamRow from "../components/club-admin/teams/ClubTeamRow";
import HelpTopicLink from "../components/club-admin/HelpTopicLink";
import { matchButtonClass, matchCardClass, pageTitleClass, tabClass } from "../components/MatchesUI";

type SeasonFilter = "current" | "upcoming" | "past";

const competitionNames = [...new Set(mockClubAdminDashboard.seasons.map((season) => season.competition))];

// The tabs follow each season's status, so they stay right when a new season starts.
const TABS: { value: SeasonFilter; label: string }[] = [
  ...(activeSeason ? [{ value: "current" as const, label: activeSeason.label }] : []),
  ...(upcomingSeason ? [{ value: "upcoming" as const, label: upcomingSeason.label }] : []),
  { value: "past", label: "Past seasons" },
];

function inTab(seasonId: string, filter: SeasonFilter) {
  const status = seasonOf(seasonId)?.status;
  if (filter === "current") return status === "ACTIVE";
  if (filter === "upcoming") return status === "UPCOMING";
  return status === "COMPLETED" || status === "ARCHIVED";
}

/** The club's teams by season: the season being played, the next season, and past seasons. */
export default function ClubAdminTeamsPage() {
  const [competition, setCompetition] = useState("ALL");
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>(TABS[0].value);
  const clubTeams = useClubTeams();
  const teamPlayers = useTeamPlayers();
  const teamManagers = useTeamManagers();
  const playerById = useMemo(() => new Map(mockPlayers.map((player) => [player.id, player])), []);

  const teams = useMemo(
    () =>
      clubTeams
        .filter((team) => team.clubId === clubAdminClubId)
        .map((team) => {
          const manager = playerById.get(teamManagers[team.id] ?? "");
          const playerCount = new Set(
            teamPlayers.filter((tp) => tp.teamId === team.id && tp.status === "ACTIVE").map((tp) => tp.playerId),
          ).size;
          return { ...team, playerCount, managerName: manager ? `${manager.firstName} ${manager.lastName}` : null };
        })
        .sort((a, b) => a.name.localeCompare(b.name) || a.sectionId.localeCompare(b.sectionId)),
    [clubTeams, teamPlayers, teamManagers, playerById],
  );

  const visibleTeams = teams.filter(
    (team) =>
      inTab(team.seasonId, seasonFilter) &&
      (competition === "ALL" || seasonOf(team.seasonId)?.competition === competition),
  );
  const tabLabel = TABS.find((tab) => tab.value === seasonFilter)?.label;

  return (
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-[#526579]">
        <span className="md:hidden">Glen Waverley · Club Admin</span>
        <span className="hidden md:inline">Club administration&nbsp; / &nbsp;Teams</span>
      </p>

      <h1 className={`mt-5 md:mt-6 ${pageTitleClass}`}>Teams</h1>
      <p className="mt-4 text-sm leading-6 text-[#d2dfed] md:text-base md:text-muted">
        Glen Waverley Tennis Club’s teams for each season, with their section, squad and team manager.
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
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={seasonFilter === tab.value}
              onClick={() => setSeasonFilter(tab.value)}
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

      <HelpTopicLink topic="teams" label="Why a new team is created each season" />
    </section>
  );
}
