import { mockMemberships } from "../data/mock-memberships";
import { getPlayerData } from "./client";

export type Membership = {
  id: string;
  isPrimary: boolean;
  status: "ACTIVE" | "INACTIVE";
  startDate: string | null;
  endDate: string | null;
};
export type MembershipTeam = {
  id: string;
  name: string;
  clubId: string;
  competitionName: string;
  seasonLabel: string; // Season type + year, e.g. "Winter 2026"
  seasonStatus: "ACTIVE" | "COMPLETED" | "ARCHIVED"; // Season.status: ACTIVE = current season
  sectionName: string;
};
export type PlayerMemberships = {
  player: { id: string; displayName: string };
  associations: (Membership & { associationId: string; name: string })[];
  clubs: (Membership & {
    clubId: string;
    associationId: string;
    associationName: string;
    name: string;
  })[];
  teams: MembershipTeam[];
};

// Logged out: the sample preview. Logged in: GET /api/v1/player/memberships,
// which returns { data: PlayerMemberships }. Errors never fall back to the sample.
export async function getPlayerMemberships(
  signal: AbortSignal,
  identity?: string,
): Promise<PlayerMemberships> {
  if (!identity) return structuredClone(mockMemberships);
  return getPlayerData<PlayerMemberships>(
    "memberships",
    identity,
    signal,
    "Could not load your memberships.",
  );
}
