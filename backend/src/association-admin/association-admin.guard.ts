import { CanActivate, ExecutionContext, ForbiddenException, Injectable, createParamDecorator } from '@nestjs/common'
import type { Request } from 'express'
import { CurrentUserResolver } from '../common/auth/current-user'
import { readOrUnavailable } from '../common/data-unavailable'
import { PrismaService } from '../prisma/prisma.service'

type AssociationAdminRequest = Request & { adminAssociationId?: string; adminUserId?: string }

/**
 * Lets a request through only for a user who holds an unrevoked ADMINISTRATOR
 * role for an association, and records that association and the user on the
 * request. The association always comes from the role, never from the request.
 * A club administrator, team manager or player is refused, as is a records
 * secretary: only the administrator sees every junior's details.
 */
@Injectable()
export class AssociationAdminGuard implements CanActivate {
  constructor(
    private readonly users: CurrentUserResolver,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AssociationAdminRequest>()
    const user = await this.users.resolve(request)
    const role = await readOrUnavailable(
      () => this.prisma.userRole.findFirst({
        where: { userId: user.id, roleType: 'ADMINISTRATOR', revokedAt: null, associationId: { not: null } },
        select: { associationId: true },
      }),
      'Association administration is unavailable right now',
    )
    if (!role?.associationId) {
      throw new ForbiddenException({
        statusCode: 403, code: 'NOT_ASSOCIATION_ADMIN', message: 'Only an association administrator can open this page',
      })
    }
    request.adminAssociationId = role.associationId
    request.adminUserId = user.id
    return true
  }
}

/** The association of the administrator that AssociationAdminGuard let through. */
export const AdminAssociationId = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AssociationAdminRequest>().adminAssociationId,
)

/** The user ID of the administrator that AssociationAdminGuard let through. */
export const AssociationAdminUserId = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AssociationAdminRequest>().adminUserId,
)
