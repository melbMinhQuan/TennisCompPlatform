import type { SeasonStatus } from "../types/season";
import { clubAdminRequest } from "./client";

/**
 * The club administrator's dashboard (ClubAdminDashboard in backend/src/club-admin/club-admin.types.ts).
 * Counts are worked out by the backend when asked; the page picks a season and filters `teams` by it.
 */
export type ClubAdminDashboardData = {
  /** Today in Melbourne, YYYY-MM-DD: the day the counts are for. */
  asOf: string;
  club: {
    id: string;
    name: string;
    associationName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  /** The administrator's first name, or their account email when they have no profile. */
  adminName: string;
  /** Players with a current membership of the club; club administrators are not counted. */
  activeMembers: number;
  /** Seasons the club has a team in, oldest first. */
  seasons: { id: string; label: string; competition: string; status: SeasonStatus }[];
  teams: {
    id: string;
    name: string;
    seasonId: string;
    competition: string;
    section: string;
    /** ACTIVE squad places. */
    squadCount: number;
    /** The current team manager (or their email without a profile); null when there is none. */
    managerName: string | null;
  }[];
  /** The administrator's unread in-app notices, as the Notifications page counts them. */
  unreadCount: number;
  /** The newest result events for the club's fixtures, newest first. */
  activity: { id: string; summary: string; match: string | null; date: string }[];
};

/** GET /api/v1/club-admin/dashboard, for the signed-in administrator's own club only. */
export function getClubAdminDashboard(signal: AbortSignal, identity?: string): Promise<ClubAdminDashboardData> {
  return clubAdminRequest("dashboard", identity, signal, "We couldn’t load your club’s dashboard. Please try again.");
}

/** The season the dashboard opens on: the one being played, else the next one, else the latest. */
export function defaultSeasonId(data: ClubAdminDashboardData) {
  const { seasons } = data;
  return (
    seasons.find((season) => season.status === "ACTIVE") ??
    seasons.find((season) => season.status === "UPCOMING") ??
    seasons.at(-1)
  )?.id ?? "";
}

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
