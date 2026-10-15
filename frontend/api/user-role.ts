import { mockClubAdminAccounts } from "../data/mock-club-admin-accounts";

/** The signed-in user's role (UserRole.roleType) and, for a club administrator, their club. */
export type SignedInRole = { role: string; clubId: string | null };

/**
 * The role to use after a successful login. Uses the login response when the backend sends `role`;
 * until then, falls back to the club admin accounts in the seed data, and everyone else is a player.
 */
export function roleFromLogin(email: string, response: { role?: string; clubId?: string | null }): SignedInRole {
  if (response.role) return { role: response.role, clubId: response.clubId ?? null };
  const clubId = mockClubAdminAccounts[email];
  return clubId ? { role: "CLUB_ADMIN", clubId } : { role: "PLAYER", clubId: null };
}

/** Where each role lands after logging in: club administrators get the club dashboard. */
export function homeForRole(role: string) {
  return role === "CLUB_ADMIN" ? "/club-admin" : "/dashboard";
}
