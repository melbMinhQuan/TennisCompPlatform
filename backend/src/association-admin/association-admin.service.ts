import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { readOrUnavailable } from '../common/data-unavailable'
import { guardianContact, sectionEligibility } from '../common/junior-privacy'
import { ageOn, calendarDate, melbourneToday } from '../dashboard/dashboard.query'
import { fullName, seasonLabel } from '../player/player-mappers'
import { PrismaService } from '../prisma/prisma.service'
import type { AssociationJunior, AssociationJuniors } from './association-admin.types'

const juniorInclude = (associationId: string) => Prisma.validator<Prisma.PlayerInclude>()({
  user: { select: { email: true } },
  clubMemberships: { include: { club: { select: { name: true } } } },
  // Only teams in this association's own competitions are its to check.
  teamPlayers: {
    where: { team: { section: { season: { competition: { associationId } } } } },
    include: { team: { include: { club: { select: { name: true } }, section: { include: { season: { include: { competition: { select: { name: true } } } } } } } } },
  },
})
type Junior = Prisma.PlayerGetPayload<{ include: ReturnType<typeof juniorInclude> }>

/**
 * The association administrator's view of juniors: every detail, so they can
 * check each junior's age against the sections they are entered in.
 */
@Injectable()
export class AssociationAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async juniors(associationId: string, adminUserId: string): Promise<AssociationJuniors> {
    return readOrUnavailable(async () => {
      const [association, admin, juniors] = await Promise.all([
        this.prisma.association.findUniqueOrThrow({ where: { id: associationId }, select: { id: true, name: true } }),
        this.prisma.user.findUniqueOrThrow({ where: { id: adminUserId }, select: { email: true, profile: { select: { firstName: true, lastName: true } } } }),
        this.prisma.player.findMany({
          // A member of the association, or of one of its clubs. Merged-away duplicates are left out.
          where: {
            isJunior: true, mergeIntoId: null,
            OR: [{ associationMemberships: { some: { associationId } } }, { clubMemberships: { some: { club: { associationId } } } }],
          },
          include: juniorInclude(associationId),
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
        }),
      ])
      const today = melbourneToday()
      return {
        asOf: today,
        association,
        adminName: admin.profile ? fullName(admin.profile) : admin.email,
        juniors: juniors.map(junior => this.junior(junior, today)),
      }
    }, 'Juniors are unavailable right now')
  }

  private junior(junior: Junior, today: string): AssociationJunior {
    const dateOfBirth = calendarDate(junior.dateOfBirth)!
    return {
      id: junior.id, code: junior.code, firstName: junior.firstName, lastName: junior.lastName,
      dateOfBirth, age: ageOn(dateOfBirth, today), gender: junior.gender, status: junior.status,
      email: junior.user?.email ?? null, phone: junior.phone, guardian: guardianContact(junior),
      clubs: junior.clubMemberships
        .map(membership => ({ clubId: membership.clubId, name: membership.club.name, isPrimary: membership.isPrimary, status: membership.status }))
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name)),
      teams: junior.teamPlayers
        .map(({ team, status }) => {
          const seasonStart = calendarDate(team.section.season.startDate)
          return {
            teamId: team.id, teamName: team.name, clubName: team.club.name,
            competitionName: team.section.season.competition.name,
            seasonLabel: seasonLabel(team.section.season), seasonStatus: team.section.season.status, seasonStart,
            sectionName: team.section.name, status,
            ...sectionEligibility(dateOfBirth, team.section, seasonStart),
          }
        })
        .sort((a, b) => (b.seasonStart ?? '').localeCompare(a.seasonStart ?? '') || a.teamName.localeCompare(b.teamName)),
    }
  }
}
