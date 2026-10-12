import { CanActivate, ExecutionContext, ForbiddenException, Injectable, createParamDecorator } from '@nestjs/common'
import type { Request } from 'express'
import { CurrentUserResolver } from '../common/auth/current-user'
import { readOrUnavailable } from '../common/data-unavailable'
import { PrismaService } from '../prisma/prisma.service'

type ClubAdminRequest = Request & { adminClubId?: string }

/**
 * Lets a request through only for a user who holds an unrevoked CLUB_ADMIN
 * role, and records that role's club on the request. The club always comes
 * from the role, never from the request, so an admin cannot ask for another
 * club's data.
 */
@Injectable()
export class ClubAdminGuard implements CanActivate {
  constructor(
    private readonly users: CurrentUserResolver,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ClubAdminRequest>()
    const user = await this.users.resolve(request)
    const role = await readOrUnavailable(
      () => this.prisma.userRole.findFirst({
        where: { userId: user.id, roleType: 'CLUB_ADMIN', revokedAt: null, clubId: { not: null } },
        select: { clubId: true },
      }),
      'Club administration is unavailable right now',
    )
    if (!role?.clubId) {
      throw new ForbiddenException({ statusCode: 403, code: 'NOT_CLUB_ADMIN', message: 'Only a club administrator can open this page' })
    }
    request.adminClubId = role.clubId
    return true
  }
}

/** The club of the admin that ClubAdminGuard let through. */
export const AdminClubId = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<ClubAdminRequest>().adminClubId,
)
