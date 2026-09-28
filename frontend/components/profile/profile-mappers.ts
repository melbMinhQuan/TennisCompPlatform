import type { DashboardData } from "../../api/dashboard";
import type { MatchFixture } from "../../api/matches";
import type { PlayerProfileData } from "../PlayerProfile";
import type { UpcomingCompetitionItem } from "../UpcomingCompetition";
import { dateParts, formatTime } from "../../utils/date-helpers";

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
    clubs: profile.primaryClub ? [profile.primaryClub.name] : [],
    teams: profile.teams.map((team) => team.name),
    association: profile.primaryAssociation?.name ?? null,
    playerId: profile.id,
  };
}

/** Upcoming (not completed or cancelled) fixtures, soonest first, shaped for the Upcoming Competition card. */
export function toUpcomingCompetitions(fixtures: MatchFixture[]): UpcomingCompetitionItem[] {
  return fixtures
    .filter((fixture) => fixture.status !== "Completed" && fixture.status !== "Cancelled")
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .map((fixture) => {
      const { weekday, day, month } = dateParts(fixture.date);
      return {
        id: fixture.id,
        month,
        day,
        weekday,
        name: fixture.competition,
        event: `${fixture.homeTeam} vs ${fixture.awayTeam} · Round ${fixture.round}`,
        location: fixture.venue ?? "Venue to be confirmed",
        time: formatTime(fixture.time),
        status: fixture.status === "Postponed" ? "Postponed" : undefined,
      };
    });
}
