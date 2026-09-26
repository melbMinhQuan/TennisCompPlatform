import { membershipsAreMock, type MembershipTeam } from "./memberships";
import { mockMemberships } from "../data/mock-memberships";
import { getMockTeamMembers } from "../data/mock-team-members";

export type TeamDetails = MembershipTeam & {
  clubName: string;
  associationName: string;
  // isCurrentPlayer: true for the logged-in player (the server knows who that is).
  members: { id: string; name: string; status: "ACTIVE" | "EMERGENCY" | "INACTIVE"; isCurrentPlayer: boolean }[];
};

// Configure the agreed teams collection URL; team ID is appended by this adapter.
// Backend authorizes the viewer and returns only permitted roster information.
export async function getTeamDetails(teamId: string, signal: AbortSignal): Promise<TeamDetails | null> {
  const baseUrl = import.meta.env.VITE_TEAMS_API_URL as string | undefined;
  if (!baseUrl && membershipsAreMock) {
    const team = mockMemberships.teams.find(t => t.id === teamId);
    if (!team) return null;
    const club = mockMemberships.clubs.find(c => c.clubId === team.clubId)!;
    return structuredClone({ ...team, clubName: club.name, associationName: club.associationName, members: getMockTeamMembers(teamId, mockMemberships.player.id) });
  }
  if (!baseUrl) throw new Error("Team details are not available yet.");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(teamId)}`, { signal, credentials: "include" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("We couldn’t load this team. Please try again.");
  const body = await response.json() as { data: TeamDetails };
  return body.data;
}
