import { clubAdminRequest } from "./client";

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

/** GET /api/v1/club-admin/support-contacts, for the signed-in administrator's own club (US-18). */
export function getClubAdminSupportContacts(signal: AbortSignal, identity?: string): Promise<ClubAdminSupportContactsData> {
  return clubAdminRequest("support-contacts", identity, signal, "Could not load your contacts.");
}
