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

/** Team ID -> its current manager's name, or their account email when they have no profile. */
export async function teamManagerNames(prisma: PrismaService, teamIds: string[]): Promise<Map<string, string>> {
  if (!teamIds.length) return new Map()
  const roles = await prisma.userRole.findMany({
    where: { roleType: 'TEAM_MANAGER', revokedAt: null, teamId: { in: teamIds } },
    include: { user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } } },
    // The longest-serving manager wins if a team somehow has two, as roleHolderName does.
    orderBy: [{ grantedAt: 'asc' }, { id: 'asc' }],
  })
  const names = new Map<string, string>()
  for (const role of roles) {
    if (!names.has(role.teamId!)) names.set(role.teamId!, role.user.profile ? fullName(role.user.profile) : role.user.email)
  }
  return names
}
