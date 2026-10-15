import { clubAdminClubId } from "../data/club-admin-dashboard";
import sample from "../data/mock-club-admin-fixtures.json";

type FixtureTeam = { id: string; name: string; clubId: string };

/** One set in a rubber; null games mean the score was not recorded. */
type RubberSet = { number: number; home: number | null; away: number | null };

/** One rubber of a recorded result, with player names and set scores (home first). */
export type FixtureRubber = {
  id: string;
  number: number;
  /** DOUBLES or SINGLES. */
  type: string;
  /** COMPLETED, FORFEIT or WALKOVER. */
  outcome: string;
  homePlayers: string[];
  awayPlayers: string[];
  sets: RubberSet[];
};

/** Recorded result for a fixture (MatchResult). */
export type FixtureResult = {
  /** FINALISED, PENDING_CONFIRMATION or UNDER_CORRECTION. */
  status: string;
  homeRubbers: number | null;
  awayRubbers: number | null;
  rubbers: FixtureRubber[];
};

/** One fixture involving the administrator's club, with its result if one is recorded. */
export type ClubAdminFixture = {
  id: string;
  clubId: string;
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  competition: string;
  seasonId: string;
  seasonLabel: string;
  section: string;
  round: string;
  /** YYYY-MM-DD and HH:mm, local to the venue; null while postponed. */
  date: string | null;
  time: string | null;
  /** SCHEDULED, POSTPONED, CANCELLED or COMPLETED. */
  status: string;
  /** True when a FixtureScheduleChange exists for this fixture. */
  changed: boolean;
  venue: { name: string; address: string | null } | null;
  result: FixtureResult | null;
};

export type FixtureView = "fixtures" | "results";

export type FixtureFilter = { view: FixtureView; season: string; team: string; search: string };

/**
 * Workbook snapshot for the administrator's club.
 *
 * Planned endpoint for the API team: GET /api/v1/clubs/:clubId/fixtures (plus a detail endpoint).
 * The backend must authorise the club from the login, including detail requests.
 * A live API failure must never fall back to this snapshot.
 */
export async function getClubAdminFixtures(signal: AbortSignal): Promise<ClubAdminFixture[]> {
  signal.throwIfAborted();
  return structuredClone(sample);
}

/** True when the fixture belongs to the administrator's club and one of its teams plays in it. */
export function isClubFixture(fixture: ClubAdminFixture) {
  return (
    fixture.clubId === clubAdminClubId &&
    (fixture.homeTeam.clubId === clubAdminClubId || fixture.awayTeam.clubId === clubAdminClubId)
  );
}

/** The administrator's own teams that play in at least one fixture, as [id, name] pairs. */
export function clubTeamsOf(fixtures: ClubAdminFixture[]) {
  const teams = fixtures
    .flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam])
    .filter((team) => team.clubId === clubAdminClubId);
  return [...new Map(teams.map((team) => [team.id, team.name])).entries()];
}

/**
 * Fixtures for the selected tab and filters. Fixtures are soonest first (no date last);
 * results are most recent first.
 */
export function filterClubFixtures(fixtures: ClubAdminFixture[], { view, season, team, search }: FixtureFilter) {
  const query = search.trim().toLowerCase();
  const matchesSearch = (fixture: ClubAdminFixture) =>
    `${fixture.homeTeam.name} ${fixture.awayTeam.name} ${fixture.competition} ${fixture.section} ${fixture.round} ${fixture.venue?.name ?? ""}`
      .toLowerCase()
      .includes(query);

  return fixtures
    .filter(
      (fixture) =>
        isClubFixture(fixture) &&
        (view === "results" ? fixture.result !== null : fixture.status !== "COMPLETED") &&
        (season === "all" || fixture.seasonId === season) &&
        (team === "all" || fixture.homeTeam.id === team || fixture.awayTeam.id === team) &&
        (!query || matchesSearch(fixture)),
    )
    .sort((a, b) =>
      view === "results"
        ? (b.date ?? "").localeCompare(a.date ?? "")
        : (a.date ?? "9999").localeCompare(b.date ?? "9999"),
    );
}
