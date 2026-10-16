import { mockClubAdminAccounts } from "../data/mock-club-admin-accounts";

/** The signed-in user's role (UserRole.roleType), their club (club roles only) and their name. */
export type SignedInRole = {
  role: string;
  clubId: string | null;
  clubName: string | null;
  displayName: string | null;
};

type LoginDetails = { role?: string | null; clubId?: string | null; clubName?: string | null; displayName?: string | null };

/**
 * The role to use after a successful login. Uses the login response when the backend sends `role`;
 * until then, falls back to the club admin accounts in the seed data, and everyone else is a player.
 */
export function roleFromLogin(email: string, response: LoginDetails): SignedInRole {
  const clubName = response.clubName ?? null;
  const displayName = response.displayName ?? null;
  if (response.role) return { role: response.role, clubId: response.clubId ?? null, clubName, displayName };
  const clubId = mockClubAdminAccounts[email];
  return clubId
    ? { role: "CLUB_ADMIN", clubId, clubName, displayName }
    : { role: "PLAYER", clubId: null, clubName, displayName };
}

/** Where each role lands after logging in: club administrators get the club dashboard. */
export function homeForRole(role: string) {
  return role === "CLUB_ADMIN" ? "/club-admin" : "/dashboard";
}
