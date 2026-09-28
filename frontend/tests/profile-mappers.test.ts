import { describe, expect, test } from "vitest";
import type { DashboardData } from "../api/dashboard";
import type { MatchFixture } from "../api/matches";
import { toPlayerProfile, toUpcomingCompetitions } from "../components/profile/profile-mappers";

const fixture = (overrides: Partial<MatchFixture>): MatchFixture => ({
  id: "fx", competitionEntryId: "team", competition: "Weekend Senior", season: "Winter 2026",
  association: "Waverley Tennis", section: "Section 1", format: "Team singles & doubles",
  round: 1, roundLabel: null, homeTeam: "Home A", awayTeam: "Away A", club: "Club", team: "Home A",
  date: "2026-10-03", time: "13:00", side: "Home", status: "Scheduled", venue: null, address: null,
  ...overrides,
});

describe("FE-005: profile card mapping", () => {
  test("lists every club, the teams and the association from the dashboard API", () => {
    const profile = {
      id: "player-1", avatarUrl: null, displayName: "Chloe Cooper", status: "ACTIVE", dateOfBirth: "1983-05-05",
      age: 43, gender: "FEMALE", email: "chloe@club.example", phone: null,
      primaryClub: { id: "c1", name: "Glen Waverley TC" }, primaryAssociation: { id: "a1", name: "Waverley Tennis" },
      clubs: [{ id: "c1", name: "Glen Waverley TC" }, { id: "c2", name: "Syndal TC" }],
      teams: [{ id: "t1", name: "Mount Waverley A" }],
    } satisfies DashboardData["profile"];
    const card = toPlayerProfile(profile);
    expect(card.clubs).toEqual(["Glen Waverley TC", "Syndal TC"]);
    expect(card.teams).toEqual(["Mount Waverley A"]);
    expect(card.association).toBe("Waverley Tennis");
    expect(card.playerId).toBe("player-1");
    expect(card.phone).toBeNull();
  });
});

describe("FE-006: upcoming fixtures card", () => {
  test("drops completed and cancelled fixtures, puts undated ones last, and labels finals", () => {
    const items = toUpcomingCompetitions([
      fixture({ id: "done", status: "Completed" }),
      fixture({ id: "off", status: "Cancelled" }),
      fixture({ id: "tbc", status: "Postponed", date: null }),
      fixture({ id: "later", date: "2026-10-10", round: null, roundLabel: "Grand Final", venue: "Regional Centre" }),
      fixture({ id: "soon", date: "2026-10-03" }),
    ]);
    expect(items.map((item) => item.id)).toEqual(["soon", "later", "tbc"]);
    expect(items[0]).toMatchObject({ month: "OCT", day: "3", weekday: "SAT", time: "1:00 PM", location: "Venue to be confirmed" });
    expect(items[1].event).toBe("Home A vs Away A · Grand Final");
    expect(items[1].location).toBe("Regional Centre");
    expect(items[2].status).toBe("Postponed");
  });
});
