import { Prisma, RoleType } from '@prisma/client'
import { fullName } from '../player/player-mappers'
import { PrismaService } from '../prisma/prisma.service'

/** Name of whoever currently holds a role in a club, team or association, or null. */
export async function roleHolderName(
  prisma: PrismaService,
  roleType: RoleType,
  context: Prisma.UserRoleWhereInput,
): Promise<string | null> {
  const role = await prisma.userRole.findFirst({
    where: { ...context, roleType, revokedAt: null },
    include: { user: { select: { profile: { select: { firstName: true, lastName: true } } } } },
    orderBy: [{ grantedAt: 'asc' }, { id: 'asc' }],
  })
  return role?.user.profile ? fullName(role.user.profile) : null
}
