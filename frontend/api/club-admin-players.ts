import type { SeasonStatus } from "../types/season";
import { clubAdminRecord, clubAdminRequest } from "./client";

// Shapes from backend/src/club-admin/club-admin.types.ts. IDs are database UUIDs.

export type PlayerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type TeamPlayerStatus = "ACTIVE" | "EMERGENCY" | "INACTIVE";

/** A player's membership of a club, dates as YYYY-MM-DD. INACTIVE plus an end date is a former member. */
export type ClubPlayerMembership = {
  status: "ACTIVE" | "INACTIVE";
  isPrimary: boolean;
  startDate: string | null;
  endDate: string | null;
};

/** One row of the club's Players list. No date of birth or contact details. */
export type ClubPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  /** The player record's own status: only an ACTIVE player can join a squad or manage a team. */
  status: PlayerStatus;
  membership: ClubPlayerMembership;
  /** Names of the club's teams the player is ACTIVE on. */
  teamNames: string[];
  /** A manager needs a login account. */
  hasLogin: boolean;
  /** The one role their account holds (UserRole.roleType), or null. */
  role: string | null;
  /** The team they manage in a season still to finish, which stops them managing another. */
  managedTeam: { id: string; name: string } | null;
};

/** A member of the club with every club they belong to (primary first) and this club's teams only. */
export type ClubPlayerDetail = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isJunior: boolean;
  email: string | null;
  phone: string | null;
  status: PlayerStatus;
  memberships: (ClubPlayerMembership & { clubId: string; clubName: string })[];
  teams: {
    teamId: string;
    teamName: string;
    sectionName: string;
    status: TeamPlayerStatus;
    registeredAt: string | null;
    seasonId: string;
    seasonLabel: string;
    seasonStatus: SeasonStatus;
    competitionId: string;
    competitionName: string;
  }[];
};

/** One registry search result: never a date of birth or contact details, only whether they agree. */
export type RegistryMatch = {
  id: string;
  firstName: string;
  lastName: string;
  match: {
    name: "exact" | "similar";
    nameReasons: string[];
    /** Null when the administrator did not give one. */
    dateOfBirth: boolean | null;
    email: boolean | null;
  };
  /** Already a current member of the administrator's club: there is nothing to add. */
  inThisClub: boolean;
  /** Other clubs the player is a current member of, by name. */
  otherClubs: string[];
};

/** What the administrator typed: the name is required; date of birth (YYYY-MM-DD) and email only rank the results. */
export type RegistrySearch = { name: string; dateOfBirth?: string; playerEmail?: string };

/** The details POST /api/v1/club-admin/players needs. Gender matches the database enum. */
export type NewPlayerDetails = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "FEMALE" | "MALE" | "OTHER";
};

/** GET /api/v1/club-admin/players: everyone with a membership of the club, active or not, by name. */
export function getClubPlayers(signal: AbortSignal, identity?: string): Promise<ClubPlayer[]> {
  return clubAdminRequest("players", identity, signal, "We couldn’t load your club’s players. Please try again.");
}

/** GET /api/v1/club-admin/players/:id. Null when they are not a member of the club. */
export function getClubPlayer(playerId: string, signal: AbortSignal, identity?: string): Promise<ClubPlayerDetail | null> {
  return clubAdminRecord(`players/${encodeURIComponent(playerId)}`, identity, signal, "We couldn’t load this player. Please try again.");
}

/** GET /api/v1/club-admin/registry/players: up to 20 registered players who could be this person, best first. */
export function searchRegistry(search: RegistrySearch, identity: string | undefined, signal: AbortSignal): Promise<RegistryMatch[]> {
  const query: Record<string, string> = { name: search.name };
  if (search.dateOfBirth) query.dateOfBirth = search.dateOfBirth;
  if (search.playerEmail) query.playerEmail = search.playerEmail;
  return clubAdminRequest("registry/players", identity, signal, "The player registry couldn’t be searched. Please try again.", { query });
}

/** POST /api/v1/club-admin/players/:id/membership: a registered player joins the club from today. */
export function addClubMember(playerId: string, identity: string | undefined, signal: AbortSignal): Promise<ClubPlayerDetail> {
  return clubAdminRequest(`players/${encodeURIComponent(playerId)}/membership`, identity, signal, "We couldn’t add this player. Please try again.", {
    method: "POST",
  });
}

/** POST /api/v1/club-admin/players: registers someone new as a member of the club. 409 POSSIBLE_DUPLICATE names the existing record. */
export function createClubPlayer(details: NewPlayerDetails, identity: string | undefined, signal: AbortSignal): Promise<ClubPlayerDetail> {
  return clubAdminRequest("players", identity, signal, "We couldn’t create this player. Please try again.", { body: details });
}
