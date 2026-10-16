import type { DashboardData } from "../../api/dashboard";
import type { MatchFixture } from "../../api/matches";
import type { PlayerProfileData } from "../PlayerProfile";
import type { UpcomingCompetitionItem } from "../UpcomingCompetition";
import { dateParts, formatTime, todayInMelbourne } from "../../utils/date-helpers";
import { formatRound } from "../../utils/formatters";

/** Converts the dashboard API profile into what the profile card shows. */
export function toPlayerProfile(profile: DashboardData["profile"]): PlayerProfileData {
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? undefined,
    status: profile.status as PlayerProfileData["status"],
    age: profile.age,
    gender: profile.gender,
    email: profile.email,
    phone: profile.phone,
    clubs: profile.clubs.map((club) => club.name),
    teams: profile.teams.map((team) => team.name),
    association: profile.primaryAssociation?.name ?? null,
    playerId: profile.id,
  };
}

/**
 * Still to be played: scheduled or postponed, and dated today or later (or not yet re-dated).
 * A past fixture still marked Scheduled is not upcoming. Same rule as the backend's next fixture.
 */
export function isUpcomingFixture(fixture: MatchFixture, today = todayInMelbourne()): boolean {
  return (fixture.status === "Scheduled" || fixture.status === "Postponed") &&
    (fixture.date === null || fixture.date >= today);
}

/** Played (its date has passed) but still Scheduled or Postponed: the result has not been entered yet. */
export function isAwaitingResult(fixture: MatchFixture, today = todayInMelbourne()): boolean {
  return (fixture.status === "Scheduled" || fixture.status === "Postponed") &&
    fixture.date !== null && fixture.date < today;
}

/** Upcoming fixtures, soonest first, shaped for the Upcoming Competition card. */
export function toUpcomingCompetitions(fixtures: MatchFixture[]): UpcomingCompetitionItem[] {
  const today = todayInMelbourne();
  return fixtures
    .filter((fixture) => isUpcomingFixture(fixture, today))
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .map((fixture) => {
      const { weekday, day, month } = dateParts(fixture.date);
      return {
        id: fixture.id,
        month,
        day,
        weekday,
        name: fixture.competition,
        event: `${fixture.homeTeam} vs ${fixture.awayTeam} · ${formatRound(fixture)}`,
        location: fixture.venue ?? "Venue to be confirmed",
        time: formatTime(fixture.time),
        status: fixture.status === "Postponed" ? "Postponed" : undefined,
      };
    });
}
