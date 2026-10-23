import type { RoleType } from '@prisma/client'

export type LoginResult = 'login_success' | 'login_failed'

export interface LoginResponse {
  result: LoginResult
  /** The account's unrevoked role on success, so the frontend can pick the right dashboard. */
  role?: RoleType | null
  /** The club the role is scoped to (set for CLUB_ADMIN), so the frontend shows that admin's own club. */
  clubId?: string | null
  /** That club's name, for the club admin header. */
  clubName?: string | null
  /** "First Last" from the account's profile; null when the account has no profile. */
  displayName?: string | null
}
