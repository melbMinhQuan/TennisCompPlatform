import { mockSupportContacts } from "../data/mock-support-contacts";
import { getPlayerData } from "./client";

// Who the logged-in player should contact. Any part can be null when it isn't known.
export type SupportContactsData = {
  // Current-season team; contact goes through the team's club, the manager is named only.
  team: {
    teamName: string;
    competitionName: string;
    seasonLabel: string;
    managerName: string | null;
    clubName: string;
    phone: string | null;
    email: string | null;
  } | null;
  // Primary club: responsible for the player's record (ClubMembership.is_primary).
  club: {
    clubName: string;
    adminName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  // Primary association: runs the competitions; recordsSecretaryName from UserRole RECORDS_SECRETARY.
  association: {
    name: string;
    recordsSecretaryName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

// Logged out: the sample contacts. Logged in: GET /api/v1/player/support-contacts,
// which returns { data: SupportContactsData }. Errors never fall back to the sample.
export async function getSupportContacts(
  signal: AbortSignal,
  identity?: string,
): Promise<SupportContactsData> {
  if (!identity) return structuredClone(mockSupportContacts);
  return getPlayerData<SupportContactsData>(
    "support-contacts",
    identity,
    signal,
    "Could not load your contacts.",
  );
}
