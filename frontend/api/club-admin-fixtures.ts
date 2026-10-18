import { clubAdminRecord, clubAdminRequest } from "./client";

type FixtureTeam = { id: string; name: string; clubId: string };

export type FixtureStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED";
export type ResultStatus = "PENDING_CONFIRMATION" | "FINALISED" | "UNDER_CORRECTION";
export type RubberType = "SINGLES" | "DOUBLES";
export type RubberOutcome = "COMPLETED" | "RETIRED" | "WALKOVER" | "FORFEIT" | "ABANDONED";

/** One set in a rubber; null games mean the score was not recorded. */
type RubberSet = { number: number; home: number | null; away: number | null };

/** One rubber of a recorded result, with player names and set scores (home first). */
export type FixtureRubber = {
  id: string;
  number: number;
  type: RubberType;
  /** Null while the rubber's outcome is not recorded. */
  outcome: RubberOutcome | null;
  homePlayers: string[];
  awayPlayers: string[];
  sets: RubberSet[];
};

/** Recorded result for a fixture (MatchResult). A DRAFT is never sent: it has not been submitted. */
export type FixtureResult = {
  status: ResultStatus;
  homeRubbers: number | null;
  awayRubbers: number | null;
  rubbers: FixtureRubber[];
};

/**
 * One fixture involving the administrator's club, with its result if one is recorded
 * (ClubAdminFixture in backend/src/club-admin/club-admin.types.ts).
 */
export type ClubAdminFixture = {
  id: string;
  /** The administrator's club, which tells its own teams from opponents. */
  clubId: string;
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  competition: string;
  seasonId: string;
  seasonLabel: string;
  section: string;
  /** "Round 13", the finals label ("Grand Final"), or "Round to be confirmed". */
  round: string;
  /** YYYY-MM-DD and HH:mm, local to the venue; null while postponed. */
  date: string | null;
  time: string | null;
  status: FixtureStatus;
  /** True when a FixtureScheduleChange exists for this fixture. */
  changed: boolean;
  venue: { name: string; address: string | null } | null;
  result: FixtureResult | null;
};

export type FixtureView = "fixtures" | "results";

export type FixtureFilter = { view: FixtureView; season: string; team: string; search: string };

/**
 * GET /api/v1/club-admin/fixtures: every fixture one of the club's teams plays in, all seasons.
 * The backend works out the club from the login; an error is shown, never a sample.
 */
export function getClubAdminFixtures(signal: AbortSignal, identity?: string): Promise<ClubAdminFixture[]> {
  return clubAdminRequest("fixtures", identity, signal, "We couldn’t load your club’s fixtures. Please try again.");
}

/** GET /api/v1/club-admin/fixtures/:id. Null when the club does not play in it, or there is no such fixture. */
export function getClubAdminFixture(fixtureId: string, signal: AbortSignal, identity?: string): Promise<ClubAdminFixture | null> {
  return clubAdminRecord(`fixtures/${encodeURIComponent(fixtureId)}`, identity, signal, "We couldn’t load this fixture. Please try again.");
}

/** True when one of the administrator's club's teams plays in the fixture, home or away. */
export function isClubFixture(fixture: ClubAdminFixture) {
  return fixture.homeTeam.clubId === fixture.clubId || fixture.awayTeam.clubId === fixture.clubId;
}

/** The administrator's own teams that play in at least one fixture, as [id, name] pairs. */
export function clubTeamsOf(fixtures: ClubAdminFixture[]) {
  const teams = fixtures.flatMap((fixture) =>
    [fixture.homeTeam, fixture.awayTeam].filter((team) => team.clubId === fixture.clubId),
  );
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
