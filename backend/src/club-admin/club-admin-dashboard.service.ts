import { Injectable } from '@nestjs/common'
import { readOrUnavailable } from '../common/data-unavailable'
import { teamManagerNames } from '../common/role-holder'
import { seasonLabel } from '../player/player-mappers'
import { PrismaService } from '../prisma/prisma.service'
import { isClubAdmin, playerRole } from './club-admin.service'
import type { ClubAdminDashboard } from './club-admin.types'
import { isCurrentMembership, localToday } from './membership'

/** How many result events the Recent activity card shows. */
const ACTIVITY_LIMIT = 5

const fixtureSides = { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } as const

/** "Round 12 · Forest Hill B vs Glen Waverley B"; the finals label in place of a round number. */
function matchLabel(fixture: { roundNumber: number | null; roundLabel: string | null; homeTeam: { name: string }; awayTeam: { name: string } }) {
  const round = fixture.roundLabel ?? (fixture.roundNumber === null ? null : `Round ${fixture.roundNumber}`)
  return [round, `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`].filter(Boolean).join(' · ')
}

/**
 * The club admin's dashboard: the club, its seasons and teams with the setup
 * each still needs, the admin's unread count and recent result activity.
 * Which teams need attention is left to the page, which knows the selected season.
 */
@Injectable()
export class ClubAdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(clubId: string, adminUserId: string): Promise<ClubAdminDashboard> {
    return readOrUnavailable(async () => {
      const [club, admin, memberships, teams, unreadCount, activity] = await Promise.all([
        this.prisma.club.findUniqueOrThrow({ where: { id: clubId }, include: { association: { select: { name: true } } } }),
        this.prisma.user.findUniqueOrThrow({ where: { id: adminUserId }, select: { email: true, profile: { select: { firstName: true } } } }),
        this.prisma.clubMembership.findMany({ where: { clubId }, include: { player: { include: playerRole } } }),
        this.prisma.team.findMany({
          where: { clubId },
          include: {
            section: { include: { season: { include: { competition: { select: { name: true } } } } } },
            _count: { select: { teamPlayers: { where: { status: 'ACTIVE' } } } },
          },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.notification.count({ where: { userId: adminUserId, channel: 'IN_APP', readAt: null } }),
        this.activity(clubId),
      ])
      const managers = await teamManagerNames(this.prisma, teams.map(team => team.id))
      const today = localToday()
      const seasons = new Map(teams.map(team => [team.section.season.id, team.section.season]))
      return {
        asOf: today,
        club: {
          id: club.id, name: club.name, associationName: club.association.name,
          phone: club.phone, email: club.email, address: club.address,
        },
        adminName: admin.profile?.firstName ?? admin.email,
        activeMembers: new Set(memberships
          .filter(membership => isCurrentMembership(membership, today) && !isClubAdmin(membership.player))
          .map(membership => membership.playerId)).size,
        seasons: [...seasons.values()]
          // Oldest first; undated seasons go last.
          .sort((a, b) => (a.startDate?.getTime() ?? Infinity) - (b.startDate?.getTime() ?? Infinity)
            || (a.year ?? Infinity) - (b.year ?? Infinity) || a.competition.name.localeCompare(b.competition.name))
          .map(season => ({ id: season.id, label: seasonLabel(season), competition: season.competition.name, status: season.status })),
        teams: teams.map(team => ({
          id: team.id, name: team.name, seasonId: team.section.season.id,
          competition: team.section.season.competition.name, section: team.section.name,
          squadCount: team._count.teamPlayers, managerName: managers.get(team.id) ?? null,
        })),
        unreadCount,
        activity,
      }
    }, 'The dashboard is unavailable right now')
  }

  /**
   * The newest audit events about results of fixtures the club plays in: results
   * finalised, corrections requested, and corrections approved or rejected.
   * Correction reviews are logged against the request, so they are traced to
   * their result through it.
   */
  private async activity(clubId: string): Promise<ClubAdminDashboard['activity']> {
    const results = await this.prisma.matchResult.findMany({
      where: { fixture: { OR: [{ homeTeam: { clubId } }, { awayTeam: { clubId } }] } },
      select: { id: true, corrections: { select: { id: true } }, fixture: { select: { roundNumber: true, roundLabel: true, ...fixtureSides } } },
    })
    if (!results.length) return []
    const resultOf = new Map<string, (typeof results)[number]>()
    for (const result of results) {
      resultOf.set(result.id, result)
      for (const request of result.corrections) resultOf.set(request.id, result)
    }
    const events = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'MatchResult', entityId: { in: results.map(result => result.id) } },
          { entityType: 'CorrectionRequest', entityId: { in: results.flatMap(result => result.corrections.map(request => request.id)) } },
        ],
      },
      orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
      take: ACTIVITY_LIMIT,
    })
    return events.map(event => {
      const result = resultOf.get(event.entityId!)
      return {
        id: event.id,
        summary: event.changeSummary ?? event.action,
        match: result ? matchLabel(result.fixture) : null,
        date: event.changedAt.toISOString(),
      }
    })
  }
}
