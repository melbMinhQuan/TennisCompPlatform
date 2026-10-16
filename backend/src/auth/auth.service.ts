import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import type { RoleType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export type LoginResult = 'login_success' | 'login_failed'

export interface LoginResponse {
  result: LoginResult
  /** The account's unrevoked role on success, so the frontend can pick the right dashboard. */
  role?: RoleType | null
  /** The club the role is scoped to (set for CLUB_ADMIN), so the frontend shows that admin's own club. */
  clubId?: string | null
  /** That club's name, for the club admin header. */
  clubName?: string | null
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Checks an email and password against the user table.
   * Returns { result: 'login_success', role, clubId, clubName } when they match, where
   * role is the account's unrevoked RoleType or null and clubId/clubName are that
   * role's club (or null), and { result: 'login_failed' } when the
   * email is unknown or the password is wrong.
   *
   * The stored value is a bcrypt hash, so the password is compared with
   * bcrypt.compare rather than a plain equality check.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      })

      if (!user) return { result: 'login_failed' }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash)
      if (!passwordMatches) return { result: 'login_failed' }

      const role = await this.prisma.userRole.findFirst({
        where: { userId: user.id, revokedAt: null },
        select: { roleType: true, clubId: true },
      })
      const clubId = role?.clubId ?? null
      const club = clubId
        ? await this.prisma.club.findUnique({ where: { id: clubId }, select: { name: true } })
        : null
      return { result: 'login_success', role: role?.roleType ?? null, clubId, clubName: club?.name ?? null }
    } catch (error) {
      this.logger.error('Could not verify the login credentials', error)
      throw new InternalServerErrorException('Login is unavailable right now')
    }
  }
}
