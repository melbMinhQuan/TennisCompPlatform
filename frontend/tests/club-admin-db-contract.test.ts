import { describe, expect, it } from "vitest";
import { getClubAdminFixtures } from "../api/club-admin-fixtures";
import { mockClubAdminAccounts } from "../data/mock-club-admin-accounts";
import { mockClubAdminDashboard } from "../data/club-admin-dashboard";
import {
  mockClubs,
  mockClubMemberships,
  mockPlayers,
  mockTeams,
  mockTeamPlayers,
} from "../data/mock-club-admin-players";

const workbookIdPattern = /^[A-Z][A-Z0-9-]*\d{2,}$/;

describe("club-admin database-shaped mock data", () => {
  it("uses workbook IDs and preserves membership/team references", () => {
    const playerIds = new Set(mockPlayers.map(player => player.id));
    const clubIds = new Set(mockClubs.map(club => club.id));
    const teamIds = new Set(mockTeams.map(team => team.id));
    const seasonIds = new Set(mockClubAdminDashboard.seasons.map(season => season.id));

    expect([
      ...playerIds,
      ...clubIds,
      ...teamIds,
      ...mockClubMemberships.map(membership => membership.id),
      ...mockTeamPlayers.map(teamPlayer => teamPlayer.id),
    ].every(id => workbookIdPattern.test(id))).toBe(true);

    expect(mockClubMemberships.every(
      membership => playerIds.has(membership.playerId) && clubIds.has(membership.clubId),
    )).toBe(true);
    expect(mockTeamPlayers.every(
      teamPlayer => teamIds.has(teamPlayer.teamId) && playerIds.has(teamPlayer.playerId),
    )).toBe(true);
    expect(mockTeams.every(team => seasonIds.has(team.seasonId))).toBe(true);
    expect(mockTeams.every(
      team => (team.homeVenueId === null || workbookIdPattern.test(team.homeVenueId)) &&
        (team.contactUserId === null || workbookIdPattern.test(team.contactUserId)),
    )).toBe(true);
  });

  it("uses the workbook club ID for the admin login and includes the upcoming season", () => {
    expect(mockClubAdminAccounts["margaret.hayes@admin.example"]).toBe(mockClubAdminDashboard.club.id);
    expect(mockClubAdminDashboard.seasons).toContainEqual(
      expect.objectContaining({ id: "SEA05", status: "UPCOMING" }),
    );
  });

  it("keeps fixture, result, and rubber statuses within database enums", async () => {
    const fixtures = await getClubAdminFixtures(new AbortController().signal);
    expect(fixtures.every(fixture =>
      ["SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED"].includes(fixture.status),
    )).toBe(true);
    expect(fixtures.flatMap(fixture => fixture.result ? [fixture.result] : []).every(result =>
      ["DRAFT", "PENDING_CONFIRMATION", "FINALISED", "UNDER_CORRECTION"].includes(result.status),
    )).toBe(true);
    expect(fixtures.flatMap(fixture => fixture.result?.rubbers ?? []).every(rubber =>
      ["SINGLES", "DOUBLES"].includes(rubber.type) &&
      (rubber.outcome === null || ["COMPLETED", "RETIRED", "WALKOVER", "FORFEIT", "ABANDONED"].includes(rubber.outcome)),
    )).toBe(true);
  });
});
