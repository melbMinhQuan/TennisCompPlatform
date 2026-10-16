import { clubAdminClubId } from "../data/club-admin-dashboard";
import sample from "../data/mock-club-admin-fixtures.json";

type FixtureTeam = { id: string; name: string; clubId: string };

export type FixtureStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED";
export type ResultStatus = "DRAFT" | "PENDING_CONFIRMATION" | "FINALISED" | "UNDER_CORRECTION";
export type RubberType = "SINGLES" | "DOUBLES";
export type RubberOutcome = "COMPLETED" | "RETIRED" | "WALKOVER" | "FORFEIT" | "ABANDONED";

function isFixtureStatus(status: string): status is FixtureStatus {
  return ["SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED"].includes(status);
}

function isResultStatus(status: string): status is ResultStatus {
  return ["DRAFT", "PENDING_CONFIRMATION", "FINALISED", "UNDER_CORRECTION"].includes(status);
}

function isRubberType(type: string): type is RubberType {
  return type === "SINGLES" || type === "DOUBLES";
}

function isRubberOutcome(outcome: string): outcome is RubberOutcome {
  return ["COMPLETED", "RETIRED", "WALKOVER", "FORFEIT", "ABANDONED"].includes(outcome);
}

/** One set in a rubber; null games mean the score was not recorded. */
type RubberSet = { number: number; home: number | null; away: number | null };

/** One rubber of a recorded result, with player names and set scores (home first). */
export type FixtureRubber = {
  id: string;
  number: number;
  type: RubberType;
  outcome: RubberOutcome | null;
  homePlayers: string[];
  awayPlayers: string[];
  sets: RubberSet[];
};

/** Recorded result for a fixture (MatchResult). */
export type FixtureResult = {
  status: ResultStatus;
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
  status: FixtureStatus;
  /** True when a FixtureScheduleChange exists for this fixture. */
  changed: boolean;
  venue: { name: string; address: string | null } | null;
  result: FixtureResult | null;
};

export type FixtureView = "fixtures" | "results";

export type FixtureFilter = { view: FixtureView; season: string; team: string; search: string };

const fixtures: ClubAdminFixture[] = sample.map(fixture => {
  if (!isFixtureStatus(fixture.status)) {
    throw new Error(`Unsupported fixture status in club-admin mock: ${fixture.status}`);
  }
  if (!fixture.result) return { ...fixture, status: fixture.status, result: null };
  if (!isResultStatus(fixture.result.status)) {
    throw new Error(`Unsupported result status in club-admin mock: ${fixture.result.status}`);
  }

  const rubbers = fixture.result.rubbers.map(rubber => {
    if (!isRubberType(rubber.type)) {
      throw new Error(`Unsupported rubber type in club-admin mock: ${rubber.type}`);
    }
    if (rubber.outcome !== null && !isRubberOutcome(rubber.outcome)) {
      throw new Error(`Unsupported rubber outcome in club-admin mock: ${rubber.outcome}`);
    }
    return { ...rubber, type: rubber.type, outcome: rubber.outcome };
  });

  return {
    ...fixture,
    status: fixture.status,
    result: { ...fixture.result, status: fixture.result.status, rubbers },
  };
});

/**
 * Workbook snapshot for the administrator's club.
 *
 * Planned endpoint for the API team: GET /api/v1/club-admin/fixtures (plus a detail endpoint).
 * The backend must authorise the club from the login, including detail requests.
 * A live API failure must never fall back to this snapshot.
 */
export async function getClubAdminFixtures(signal: AbortSignal): Promise<ClubAdminFixture[]> {
  signal.throwIfAborted();
  return structuredClone(fixtures);
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
