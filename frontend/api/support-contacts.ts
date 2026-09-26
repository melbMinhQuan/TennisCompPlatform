import { mockSupportContacts } from "../data/mock-support-contacts";

// Who the logged-in player should contact. Any part can be null when it isn't known.
export type SupportContactsData = {
  // Current-season team; contact goes through the team's club, the manager is named only.
  team: { teamName: string; competitionName: string; seasonLabel: string; managerName: string | null; clubName: string; phone: string | null; email: string | null } | null;
  // Primary club: responsible for the player's record (ClubMembership.is_primary).
  club: { clubName: string; adminName: string | null; phone: string | null; email: string | null; address: string | null } | null;
  // Primary association: runs the competitions; recordsSecretaryName from UserRole RECORDS_SECRETARY.
  association: { name: string; recordsSecretaryName: string | null; phone: string | null; email: string | null } | null;
};

// Optional future endpoint; the server resolves the authenticated player.
// Map a different backend response here.
const apiUrl = import.meta.env.VITE_SUPPORT_CONTACTS_API_URL as string | undefined;
export const supportContactsAreMock = !apiUrl;

export async function getSupportContacts(signal: AbortSignal): Promise<SupportContactsData> {
  if (!apiUrl) return structuredClone(mockSupportContacts);
  const response = await fetch(apiUrl, { signal, credentials: "include" });
  if (!response.ok) throw new Error("Could not load your contacts.");
  // Expected { data: SupportContactsData }. Never fall back to mock contacts on errors.
  const body = await response.json() as { data: SupportContactsData };
  return body.data;
}
