import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import type { LoginResponse } from './auth.types'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Checks an email and password against the user table.
   * Returns { result: 'login_success', role, clubId, clubName, displayName } when they
   * match, where role is the account's unrevoked RoleType or null, clubId/clubName are
   * that role's club (or null) and displayName is the profile's name (or null), and { result: 'login_failed' } when the
   * email is unknown, the password is wrong, or the account is not ACTIVE (PENDING or SUSPENDED).
   * The status is checked only after the password, so a wrong guess never learns it.
   *
   * The stored value is a bcrypt hash, so the password is compared with
   * bcrypt.compare rather than a plain equality check.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: { profile: { select: { firstName: true, lastName: true } } },
      })

      if (!user) return { result: 'login_failed' }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash)
      if (!passwordMatches || user.status !== 'ACTIVE') return { result: 'login_failed' }

      const role = await this.prisma.userRole.findFirst({
        where: { userId: user.id, revokedAt: null },
        select: { roleType: true, clubId: true },
      })
      const clubId = role?.clubId ?? null
      const club = clubId
        ? await this.prisma.club.findUnique({ where: { id: clubId }, select: { name: true } })
        : null
      const displayName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() || null : null
      return { result: 'login_success', role: role?.roleType ?? null, clubId, clubName: club?.name ?? null, displayName }
    } catch (error) {
      this.logger.error('Could not verify the login credentials', error)
      throw new InternalServerErrorException('Login is unavailable right now')
    }
  }
}
