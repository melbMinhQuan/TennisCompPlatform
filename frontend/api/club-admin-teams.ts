import type { SeasonStatus } from "../types/season";
import type { TeamPlayerStatus } from "./club-admin-players";
import { clubAdminRecord, clubAdminRequest } from "./client";

// Shapes from backend/src/club-admin/club-admin.types.ts. IDs are database UUIDs; a player's `code`
// is their readable Player ID (PLR005), null only for a player added before codes were automatic.

/** Where a section or team sits: its season and competition. */
type SeasonContext = {
  seasonId: string;
  /** "Winter 2026", or "Summer 2026/27" for a season that crosses the new year. */
  seasonLabel: string;
  seasonStatus: SeasonStatus;
  competitionId: string;
  competitionName: string;
};

export type ClubTeam = SeasonContext & {
  id: string;
  name: string;
  sectionId: string;
  sectionName: string;
};

/** One row of the club's Teams list. */
export type ClubTeamSummary = ClubTeam & {
  /** ACTIVE squad places. */
  squadCount: number;
  /** The current team manager (or their email without a profile); null when there is none. */
  managerName: string | null;
};

/** One of the club's teams with its roster and current manager, as every team change answers it. */
export type ClubTeamDetail = ClubTeam & {
  managerName: string | null;
  /** Player ID and code are null when the manager has no profile; name is then their email. */
  manager: { playerId: string | null; playerCode: string | null; name: string; email: string } | null;
  players: { id: string; code: string | null; firstName: string; lastName: string; isJunior: boolean; status: TeamPlayerStatus; registeredAt: string | null }[];
};

/** A section of an UPCOMING season run by the club's association, open for new teams. */
export type OpenSection = SeasonContext & {
  id: string;
  name: string;
  gender: string | null;
  ageGroup: string | null;
  /** Teams entered so far, from any club. */
  teamCount: number;
};

const CHANGE_FAILED = "We couldn’t save this change. Please try again.";
const teamPath = (teamId: string) => `teams/${encodeURIComponent(teamId)}`;

/** GET /api/v1/club-admin/teams: the club's teams, newest season first. */
export function getClubTeams(signal: AbortSignal, identity?: string): Promise<ClubTeamSummary[]> {
  return clubAdminRequest("teams", identity, signal, "We couldn’t load your club’s teams. Please try again.");
}

/** GET /api/v1/club-admin/teams/:id. Null when it is not one of the club's teams. */
export function getClubTeam(teamId: string, signal: AbortSignal, identity?: string): Promise<ClubTeamDetail | null> {
  return clubAdminRecord(teamPath(teamId), identity, signal, "We couldn’t load this team. Please try again.");
}

/** GET /api/v1/club-admin/open-sections: where a new team can be entered. */
export function getOpenSections(signal: AbortSignal, identity?: string): Promise<OpenSection[]> {
  return clubAdminRequest("open-sections", identity, signal, "We couldn’t load the seasons open for entries. Please try again.");
}

/** POST /api/v1/club-admin/teams. 409 TEAM_NAME_TAKEN when another team in the season has the name. */
export function createClubTeam(input: { sectionId: string; name: string }, identity: string | undefined, signal: AbortSignal): Promise<ClubTeamDetail> {
  return clubAdminRequest("teams", identity, signal, "We couldn’t create this team. Please try again.", { body: input });
}

/** POST /api/v1/club-admin/teams/:id/players. 422 PLAYERS_NOT_ELIGIBLE lists every player who cannot join. */
export function addTeamPlayers(teamId: string, playerIds: string[], identity: string | undefined, signal: AbortSignal): Promise<ClubTeamDetail> {
  return clubAdminRequest(`${teamPath(teamId)}/players`, identity, signal, CHANGE_FAILED, { body: { playerIds } });
}

/** DELETE /api/v1/club-admin/teams/:id/players/:playerId. The player stays on record as INACTIVE. */
export function removeTeamPlayer(teamId: string, playerId: string, identity: string | undefined, signal: AbortSignal): Promise<ClubTeamDetail> {
  return clubAdminRequest(`${teamPath(teamId)}/players/${encodeURIComponent(playerId)}`, identity, signal, CHANGE_FAILED, { method: "DELETE" });
}

/** PUT /api/v1/club-admin/teams/:id/manager. Replaces any current manager, who becomes a plain player again. */
export function assignTeamManager(teamId: string, playerId: string, identity: string | undefined, signal: AbortSignal): Promise<ClubTeamDetail> {
  return clubAdminRequest(`${teamPath(teamId)}/manager`, identity, signal, CHANGE_FAILED, { method: "PUT", body: { playerId } });
}

/** DELETE /api/v1/club-admin/teams/:id/manager. */
export function removeTeamManager(teamId: string, identity: string | undefined, signal: AbortSignal): Promise<ClubTeamDetail> {
  return clubAdminRequest(`${teamPath(teamId)}/manager`, identity, signal, CHANGE_FAILED, { method: "DELETE" });
}
