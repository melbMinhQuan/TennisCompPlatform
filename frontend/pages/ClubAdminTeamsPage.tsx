import { Link } from "react-router";
import { useMemo, useState } from "react";
import {
  mockTeams,
} from "../data/clubAdminPlayers";
import { useTeamPlayers } from "../data/teamSquadStore";

const CLUB_ID = "CLB01";

// Temporary display configuration.
// The current mock file does not include competition,
// season, or team manager relationships.
const DEFAULT_COMPETITION = "Weekend Senior";
const DEFAULT_SEASON = "Summer 2026/27";

type SeasonFilter = "current" | "past";

export default function ClubAdminTeamsPage() {
  const [competition, setCompetition] = useState("ALL");
  const [seasonFilter, setSeasonFilter] =
    useState<SeasonFilter>("current");
  const teamPlayers = useTeamPlayers();

  const teams = useMemo(() => {
    return mockTeams
      .filter((team) => team.clubId === CLUB_ID)
      .map((team) => {
        const playerCount = new Set(
          teamPlayers
            .filter(
              (tp) =>
                tp.teamId === team.id &&
                tp.status === "ACTIVE"
            )
            .map((tp) => tp.playerId)
        ).size;

        return {
          ...team,
          playerCount,
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name) ||
        a.sectionId.localeCompare(b.sectionId)
      );
  }, [teamPlayers]);

  // Competition and season are not currently stored
  // in the provided mock data.
  // Keep these filters visible, but do not invent
  // historical records or competition relationships.
  const visibleTeams = useMemo(() => {
    if (seasonFilter === "past") return [];

    if (
      competition !== "ALL" &&
      competition !== DEFAULT_COMPETITION
    ) {
      return [];
    }

    return teams;
  }, [teams, competition, seasonFilter]);

  const isCurrentSeason = seasonFilter === "current";

  return (
    <section className="text-white md:text-[#1a3049]">
      {/* Breadcrumb */}
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-[#526579]">
        <span className="md:hidden">
          Glen Waverley · Club Admin
        </span>
        <span className="hidden md:inline">
          Club administration&nbsp; / &nbsp;Teams
        </span>
      </p>

      {/* Page heading */}
      <h1 className="mt-5 text-[30px] font-bold leading-tight md:mt-6 md:text-[36px]">
        Teams
      </h1>

      <p className="mt-4 text-sm leading-6 text-[#d2dfed] md:text-base md:text-[#60758d]">
        Your club’s teams. A team plays in one
        competition, season and section.
      </p>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 md:mt-4 md:flex-row md:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
          <span>Competition</span>

          <select
            value={competition}
            onChange={(event) =>
              setCompetition(event.target.value)
            }
            className="min-h-11 w-full rounded-lg border border-[#c6d6e8] bg-white px-4 text-base text-[#1a3049] outline-none focus:ring-2 focus:ring-[#4278b7]"
          >
            <option value="ALL">All competitions</option>
            <option value={DEFAULT_COMPETITION}>
              {DEFAULT_COMPETITION}
            </option>
          </select>
        </label>

        <div
          role="group"
          aria-label="Filter teams by season"
          className="grid grid-cols-2 gap-2 md:flex"
        >
          <button
            type="button"
            aria-pressed={isCurrentSeason}
            onClick={() => setSeasonFilter("current")}
            className={`min-h-11 rounded-lg px-4 text-sm font-medium md:px-5 ${
              isCurrentSeason
                ? "bg-[#4278b7] text-white"
                : "bg-[#e5effa] text-[#1a3049] hover:bg-[#d6e5f6]"
            }`}
          >
            Summer 2026/27
          </button>

          <button
            type="button"
            aria-pressed={!isCurrentSeason}
            onClick={() => setSeasonFilter("past")}
            className={`min-h-11 rounded-lg px-4 text-sm font-medium md:px-5 ${
              !isCurrentSeason
                ? "bg-[#4278b7] text-white"
                : "bg-[#e5effa] text-[#1a3049] hover:bg-[#d6e5f6]"
            }`}
          >
            Past seasons
          </button>
        </div>

        {/* Create Team will be implemented later */}
        <button
          type="button"
          disabled
          title="Create team will be available in a later step"
          className="min-h-11 rounded-lg bg-[#4278b7] px-5 font-medium text-white opacity-60 md:whitespace-nowrap"
        >
          + Create team
        </button>
      </div>

      {/* Team list */}
      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <h2 className="border-b border-[#dbe4ef] pb-1 text-lg font-bold">
          {isCurrentSeason
            ? `${DEFAULT_SEASON} · ${visibleTeams.length} ${
                visibleTeams.length === 1 ? "team" : "teams"
              }`
            : "Past seasons"}
        </h2>

        {!isCurrentSeason ? (
          <p className="py-8 text-sm text-[#60758d]">
            Historical season information is not available
            in the current mock data.
          </p>
        ) : visibleTeams.length === 0 ? (
          <p className="py-8 text-sm text-[#60758d]">
            No teams found for this competition.
          </p>
        ) : (
          visibleTeams.map((team) => {
            const hasPlayers = team.playerCount > 0;

            return (
              <div
                key={team.id}
                className="border-b border-[#dbe4ef] py-4 last:border-b-0 md:flex md:items-center md:justify-between md:gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {team.name}
                  </p>

                  <p className="mt-0.5 text-sm text-[#60758d]">
                    {DEFAULT_COMPETITION} ·{" "}
                    {team.sectionId} ·{" "}
                    {team.playerCount}{" "}
                    {team.playerCount === 1
                      ? "player"
                      : "players"}
                  </p>

                  <p className="mt-1 text-xs text-[#60758d]">
                    Manager not recorded in mock data
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 md:mt-0 md:justify-end">
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      hasPlayers
                        ? "bg-[#e4f5ec] text-[#187650]"
                        : "bg-[#fff1df] text-[#a45a15]"
                    }`}
                  >
                    {hasPlayers
                      ? `${team.playerCount} in squad`
                      : "No players"}
                  </span>
                    <Link
                        to={`/club-admin/teams/${team.id}`}
                        className="text-sm font-medium text-[#4278b7] hover:underline"
                        >
                        View ›
                    </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Information box */}
      <div className="mt-4 rounded-2xl bg-[#e5effa] p-5 text-[#1a3049] md:p-6">
        <h2 className="font-bold">
          Why is there a new team each season?
        </h2>

        <p className="mt-2 text-sm leading-6">
          Teams belong to one season, so past results stay
          correct. Players’ club memberships carry over –
          you just pick them again for the new team.
        </p>
      </div>
    </section>
  );
}
