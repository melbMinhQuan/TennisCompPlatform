import { mockClubAdminSupportContacts } from "../data/mock-club-admin-support-contacts";

/** Who a club administrator contacts for help. Any part can be null when it isn't known. */
export type ClubAdminSupportContactsData = {
  // The administrator's own club (Club table): the details its players see.
  club: {
    clubName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  // The club's association (Association table). Names come from UserRole ADMINISTRATOR and RECORDS_SECRETARY.
  association: {
    name: string;
    administratorName: string | null;
    recordsSecretaryName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

/**
 * Sample contacts for the display-only Sprint 2 page.
 *
 * Planned endpoint for the API team: GET /api/v1/clubs/:clubId/support-contacts,
 * returning { data: ClubAdminSupportContactsData } for the logged-in club administrator's
 * club only (US-18). Connect it once login returns the role and clubId; errors must not
 * fall back to this sample.
 */
export async function getClubAdminSupportContacts(signal: AbortSignal): Promise<ClubAdminSupportContactsData> {
  signal.throwIfAborted();
  return structuredClone(mockClubAdminSupportContacts);
}
