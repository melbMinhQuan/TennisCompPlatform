import { mockMemberships } from "../data/mock-memberships";

export type Membership = { id: string; isPrimary: boolean; status: "ACTIVE" | "INACTIVE"; startDate: string | null; endDate: string | null };
export type MembershipTeam = {
  id: string; name: string; clubId: string; competitionName: string;
  seasonLabel: string; // Season type + year, e.g. "Winter 2026"
  seasonStatus: "ACTIVE" | "COMPLETED" | "ARCHIVED"; // Season.status: ACTIVE = current season
  sectionName: string;
};
export type PlayerMemberships = {
  player: { id: string; displayName: string };
  associations: (Membership & { associationId: string; name: string })[];
  clubs: (Membership & { clubId: string; associationId: string; associationName: string; name: string })[];
  teams: MembershipTeam[];
};

// Optional future endpoint; the server must resolve the authenticated player.
// Map the eventual backend DTO here if it differs from PlayerMemberships.
const apiUrl = import.meta.env.VITE_MEMBERSHIPS_API_URL as string | undefined;
export const membershipsAreMock = !apiUrl;
export const mockMembershipPlayer = mockMemberships.player;

export async function getPlayerMemberships(signal: AbortSignal): Promise<PlayerMemberships> {
  if (!apiUrl) return structuredClone(mockMemberships);
  const response = await fetch(apiUrl, { signal, credentials: "include" });
  if (!response.ok) throw new Error("Could not load your memberships.");
  // Integration contract: { data: PlayerMemberships }. Never fall back to mocks on errors.
  const body = await response.json() as { data: PlayerMemberships };
  return body.data;
}
