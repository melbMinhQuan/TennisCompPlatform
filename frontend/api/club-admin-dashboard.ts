import { mockClubAdminDashboard, type ClubAdminDashboardData } from "../data/club-admin-dashboard";

/**
 * Club administrator dashboard data. Returns the sample snapshot for the display-only Sprint 2 page.
 *
 * Planned endpoint for the API team: GET /api/v1/clubs/:clubId/dashboard, returning
 * { data: ClubAdminDashboardData } for the logged-in club administrator's own club only (US-18).
 * Connect it once login returns the role and clubId; errors must not fall back to this sample.
 */
export async function getClubAdminDashboard(signal: AbortSignal): Promise<ClubAdminDashboardData> {
  signal.throwIfAborted();
  return structuredClone(mockClubAdminDashboard);
}
