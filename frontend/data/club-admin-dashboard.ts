import snapshot from "./mock-club-admin-dashboard.json";

// Display-only snapshot of competition_data.xlsx (Glen Waverley Tennis Club, CLB01), not a live
// database response. The page loads it through api/club-admin-dashboard.ts.
export const mockClubAdminDashboard = snapshot;
export type ClubAdminDashboardData = typeof snapshot;

/** Unread in-app notices for the sidebar badge (sample data until the notifications API exists). */
export const clubAdminUnreadCount = snapshot.notices.filter((notice) => !notice.readAt).length;

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
