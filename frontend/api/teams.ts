import type { MembershipTeam } from "./memberships";
import { mockMemberships } from "../data/mock-memberships";
import { getMockTeamMembers } from "../data/mock-team-members";
import { ApiError, getPlayerData } from "./client";

export type TeamDetails = MembershipTeam & {
  clubName: string;
  associationName: string;
  // isCurrentPlayer: true for the logged-in player (the server knows who that is).
  members: {
    id: string;
    name: string;
    status: "ACTIVE" | "EMERGENCY" | "INACTIVE";
    isCurrentPlayer: boolean;
  }[];
};

// Logged out: the sample roster. Logged in: GET /api/v1/player/teams/:teamId, which only
// answers for a team the player is on; any other team is 404, shown as "not found".
export async function getTeamDetails(
  teamId: string,
  signal: AbortSignal,
  identity?: string,
): Promise<TeamDetails | null> {
  if (!identity) {
    const team = mockMemberships.teams.find((t) => t.id === teamId);
    if (!team) return null;
    const club = mockMemberships.clubs.find((c) => c.clubId === team.clubId)!;
    return structuredClone({
      ...team,
      clubName: club.name,
      associationName: club.associationName,
      members: getMockTeamMembers(teamId, mockMemberships.player.id),
    });
  }
  try {
    return await getPlayerData<TeamDetails>(
      `teams/${encodeURIComponent(teamId)}`,
      identity,
      signal,
      "We couldn’t load this team. Please try again.",
    );
  } catch (error) {
    // 404 (someone else's team) and 400 (not a team ID at all) both mean "not found" here.
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}
