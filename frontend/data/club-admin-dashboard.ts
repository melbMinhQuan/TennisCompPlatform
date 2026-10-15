import snapshot from "./mock-club-admin-dashboard.json";
import type { SeasonStatus } from "../types/season";

type DashboardSeason = Omit<(typeof snapshot.seasons)[number], "status"> & {
  status: SeasonStatus;
};

export type ClubAdminDashboardData = Omit<typeof snapshot, "seasons"> & {
  seasons: DashboardSeason[];
};

function isSeasonStatus(status: string): status is SeasonStatus {
  return ["UPCOMING", "ACTIVE", "COMPLETED", "ARCHIVED"].includes(status);
}

const seasons: DashboardSeason[] = snapshot.seasons.map(season => {
  if (!isSeasonStatus(season.status)) {
    throw new Error(`Unsupported season status in dashboard mock: ${season.status}`);
  }
  return { ...season, status: season.status };
});

// Display-only snapshot of competition_data.xlsx (Glen Waverley Tennis Club, CLB01), not a live
// database response. The page loads it through api/club-admin-dashboard.ts.
export const mockClubAdminDashboard: ClubAdminDashboardData = { ...snapshot, seasons };

/** The signed-in administrator's club. Later this comes from the login (UserRole), not the sample. */
export const clubAdminClubId = snapshot.club.id;

/**
 * The selected season's teams, and the teams that still need setting up
 * (no manager or no active squad). Past seasons never create current tasks.
 */
export function dashboardSeasonSummary(data: ClubAdminDashboardData, seasonId: string) {
  const teams = data.teams.filter((team) => team.seasonId === seasonId);
  const active = data.seasons.find((season) => season.id === seasonId)?.status === "ACTIVE";
  const attention = active ? teams.filter((team) => !team.managerName || team.squadCount === 0) : [];
  return { teams, attention };
}
