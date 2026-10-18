/**
 * The signed-in user: their login email, role (UserRole.roleType), club (club roles only) and name.
 * The email is how the club administrator pages identify them to the backend (a local demo lookup,
 * like the player pages), so it is kept with the role.
 */
export type SignedInRole = {
  email: string;
  role: string;
  clubId: string | null;
  clubName: string | null;
  displayName: string | null;
};

type LoginDetails = { role?: string | null; clubId?: string | null; clubName?: string | null; displayName?: string | null };

/** The signed-in user after a successful login, from what POST /auth/login answered. No role means a player. */
export function roleFromLogin(email: string, response: LoginDetails): SignedInRole {
  return {
    email,
    role: response.role || "PLAYER",
    clubId: response.clubId ?? null,
    clubName: response.clubName ?? null,
    displayName: response.displayName ?? null,
  };
}

/** Where each role lands after logging in: club administrators get the club dashboard. */
export function homeForRole(role: string) {
  return role === "CLUB_ADMIN" ? "/club-admin" : "/dashboard";
}
