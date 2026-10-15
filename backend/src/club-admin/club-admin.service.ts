import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { readOrUnavailable } from '../common/data-unavailable'
import { roleHolderName } from '../common/role-holder'
import { calendarDate, fullName, seasonLabel } from '../player/player-mappers'
import { nameFit, normalizeName, parseWrittenName } from '../player-matching/names'
import { PrismaService } from '../prisma/prisma.service'
import type { RegistrySearchDto } from './club-admin.dto'
import type {
  ClubAdminSupportContacts, ClubCompetition, ClubPlayer, ClubPlayerDetail, ClubPlayerMembership, ClubSection, ClubTeam, ClubTeamDetail,
  OpenSection, RegistryMatch,
} from './club-admin.types'
import { isCurrentMembership, localToday } from './membership'

const seasonInclude = Prisma.validator<Prisma.SeasonInclude>()({ competition: true })
type SeasonWithCompetition = Prisma.SeasonGetPayload<{ include: typeof seasonInclude }>

const teamInclude = Prisma.validator<Prisma.TeamInclude>()({ section: { include: { season: { include: seasonInclude } } } })
type TeamWithSeason = Prisma.TeamGetPayload<{ include: typeof teamInclude }>

// The player's login and role, to leave club admins' own profiles out of the Players pages.
export const playerRole = { user: { select: { userRole: { select: { roleType: true, revokedAt: true } } } } } as const
type PlayerWithRole = { user: { userRole: { roleType: string; revokedAt: Date | null } | null } | null }
export const isClubAdmin = (player: PlayerWithRole) =>
  player.user?.userRole?.roleType === 'CLUB_ADMIN' && player.user.userRole.revokedAt === null

const playerNotFound = () => new NotFoundException({ statusCode: 404, code: 'PLAYER_NOT_FOUND', message: 'Player not found' })
const byName = (a: { firstName: string; lastName: string }, b: { firstName: string; lastName: string }) =>
  fullName(a).localeCompare(fullName(b))

// Newest season first (by year, then start date); undated seasons sort last.
const newestSeason = [
  { year: { sort: 'desc' as const, nulls: 'last' as const } },
  { startDate: { sort: 'desc' as const, nulls: 'last' as const } },
]

/**
 * What a club admin may see: only competitions, sections and teams their club
 * takes part in, the club's own players, and who to contact for help. A competition or section
 * counts when at least one of the club's teams is in it.
 */
@Injectable()
export class ClubAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async competitions(clubId: string): Promise<ClubCompetition[]> {
    return readOrUnavailable(async () => {
      const competitions = await this.prisma.competition.findMany({
        where: { seasons: { some: { sections: { some: { teams: { some: { clubId } } } } } } },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      })
      return competitions.map(competition => ({
        id: competition.id, name: competition.name, type: competition.type, status: competition.status,
      }))
    }, 'Competitions are unavailable right now')
  }

  async sections(clubId: string): Promise<ClubSection[]> {
    return readOrUnavailable(async () => {
      const sections = await this.prisma.sectionGrade.findMany({
        where: { teams: { some: { clubId } } },
        include: { season: { include: seasonInclude } },
        orderBy: [...newestSeason.map(season => ({ season })), { name: 'asc' }, { id: 'asc' }],
      })
      return sections.map(section => ({
        id: section.id, name: section.name, gender: section.gender, ageGroup: section.ageGroup,
        ...this.seasonContext(section.season),
      }))
    }, 'Sections are unavailable right now')
  }

  async teams(clubId: string): Promise<ClubTeam[]> {
    return readOrUnavailable(async () => {
      const teams = await this.prisma.team.findMany({
        where: { clubId },
        include: teamInclude,
        orderBy: [...newestSeason.map(season => ({ section: { season } })), { section: { name: 'asc' } }, { name: 'asc' }, { id: 'asc' }],
      })
      return teams.map(team => this.clubTeam(team))
    }, 'Teams are unavailable right now')
  }

  /** One of the club's teams with its roster and current team manager. Another club's team is a 404. */
  async teamDetail(clubId: string, teamId: string): Promise<ClubTeamDetail> {
    return readOrUnavailable(async () => {
      const team = await this.prisma.team.findFirst({
        where: { id: teamId, clubId },
        include: { ...teamInclude, teamPlayers: { include: { player: { select: { id: true, firstName: true, lastName: true } } } } },
      })
      if (!team) throw new NotFoundException({ statusCode: 404, code: 'TEAM_NOT_FOUND', message: 'Team not found' })
      const managerName = await roleHolderName(this.prisma, 'TEAM_MANAGER', { teamId: team.id })
      return {
        ...this.clubTeam(team),
        managerName,
        players: team.teamPlayers
          .map(entry => ({
            id: entry.player.id, firstName: entry.player.firstName, lastName: entry.player.lastName,
            status: entry.status, registeredAt: entry.registerAt?.toISOString() ?? null,
          }))
          .sort(byName),
      }
    }, 'Team details are unavailable right now')
  }

  /**
   * Everyone with a membership of the club, active or not, by name. Club
   * admins' own profiles are left out: they run the club, they are not its players.
   */
  async players(clubId: string): Promise<ClubPlayer[]> {
    return readOrUnavailable(async () => {
      const memberships = await this.prisma.clubMembership.findMany({
        where: { clubId },
        include: {
          player: {
            include: {
              ...playerRole,
              teamPlayers: { where: { status: 'ACTIVE', team: { clubId } }, include: { team: { select: { name: true } } } },
            },
          },
        },
      })
      return memberships
        .filter(membership => !isClubAdmin(membership.player))
        .map(membership => ({
          id: membership.player.id, firstName: membership.player.firstName, lastName: membership.player.lastName,
          membership: this.membership(membership),
          teamNames: [...new Set(membership.player.teamPlayers.map(entry => entry.team.name))].sort(),
        }))
        .sort(byName)
    }, 'Players are unavailable right now')
  }

  /** A member of the club, with all their memberships and this club's teams only. Anyone else is a 404. */
  async playerDetail(clubId: string, playerId: string): Promise<ClubPlayerDetail> {
    return readOrUnavailable(async () => {
      const player = await this.prisma.player.findFirst({
        where: { id: playerId, clubMemberships: { some: { clubId } } },
        include: {
          user: { select: { email: true, ...playerRole.user.select } },
          clubMemberships: { include: { club: { select: { name: true } } } },
          teamPlayers: { where: { team: { clubId } }, include: { team: { include: teamInclude } } },
        },
      })
      if (!player || isClubAdmin(player)) throw playerNotFound()
      return {
        id: player.id, firstName: player.firstName, lastName: player.lastName,
        dateOfBirth: calendarDate(player.dateOfBirth)!, isJunior: player.isJunior,
        email: player.user?.email ?? null, phone: player.phone, status: player.status,
        memberships: player.clubMemberships
          .map(membership => ({ clubId: membership.clubId, clubName: membership.club.name, ...this.membership(membership) }))
          .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.clubName.localeCompare(b.clubName)),
        teams: player.teamPlayers
          .map(entry => ({
            teamId: entry.team.id, teamName: entry.team.name, sectionName: entry.team.section.name,
            status: entry.status, registeredAt: entry.registerAt?.toISOString() ?? null,
            ...this.seasonContext(entry.team.section.season),
          }))
          .sort((a, b) => b.seasonLabel.localeCompare(a.seasonLabel) || a.teamName.localeCompare(b.teamName)),
      }
    }, 'Player details are unavailable right now')
  }

  /**
   * Sections a new team can enter: those of UPCOMING seasons in competitions
   * the admin's association runs, whether or not the club has a team there yet.
   */
  async openSections(clubId: string): Promise<OpenSection[]> {
    return readOrUnavailable(async () => {
      const club = await this.prisma.club.findUnique({ where: { id: clubId }, select: { associationId: true } })
      if (!club) return []
      const sections = await this.prisma.sectionGrade.findMany({
        where: { season: { status: 'UPCOMING', competition: { associationId: club.associationId } } },
        include: { season: { include: seasonInclude }, _count: { select: { teams: true } } },
        orderBy: [{ season: { competition: { name: 'asc' } } }, ...newestSeason.map(season => ({ season })), { name: 'asc' }, { id: 'asc' }],
      })
      return sections.map(section => ({
        id: section.id, name: section.name, gender: section.gender, ageGroup: section.ageGroup,
        ...this.seasonContext(section.season), teamCount: section._count.teams,
      }))
    }, 'Sections are unavailable right now')
  }

  /**
   * Registered players who could be the person the admin is adding, best match
   * first, at most 20. The name decides who is a candidate, using the same
   * rules as scoresheet matching; date of birth and email only rank them, so a
   * typo there never hides the right person. Merged profiles and club admins
   * are left out.
   */
  async searchRegistry(clubId: string, search: RegistrySearchDto): Promise<RegistryMatch[]> {
    const written = parseWrittenName(search.name)
    if (!written) return []
    // A cheap first cut by initial; nameFit below makes the real decision.
    const initial = (written.kind === 'full' ? written.last : written.word).charAt(0)
    const startsWith = { startsWith: initial, mode: 'insensitive' as const }
    return readOrUnavailable(async () => {
      const people = await this.prisma.player.findMany({
        where: {
          mergeIntoId: null,
          ...(written.kind === 'full' ? { lastName: startsWith } : { OR: [{ firstName: startsWith }, { lastName: startsWith }] }),
        },
        include: {
          user: { select: { email: true, ...playerRole.user.select } },
          clubMemberships: { include: { club: { select: { name: true } } } },
        },
        take: 2000,
      })
      const today = localToday()
      const typedName = normalizeName(search.name)
      return people
        .filter(person => !isClubAdmin(person))
        .flatMap(person => {
          const nameReasons = nameFit(written, person)
          if (!nameReasons) return []
          const exact = normalizeName(fullName(person)) === typedName
          const dateOfBirth = search.dateOfBirth ? calendarDate(person.dateOfBirth) === search.dateOfBirth : null
          const email = search.playerEmail ? person.user?.email === search.playerEmail : null
          const current = person.clubMemberships.filter(membership => isCurrentMembership(membership, today))
          const match: RegistryMatch = {
            id: person.id, firstName: person.firstName, lastName: person.lastName,
            match: { name: exact ? 'exact' : 'similar', nameReasons, dateOfBirth, email },
            inThisClub: current.some(membership => membership.clubId === clubId),
            otherClubs: current.filter(membership => membership.clubId !== clubId).map(membership => membership.club.name).sort(),
          }
          return [{ match, score: (exact ? 100 : 20) + (dateOfBirth ? 30 : 0) + (email ? 30 : 0) }]
        })
        .sort((a, b) => b.score - a.score || byName(a.match, b.match))
        .slice(0, 20)
        .map(({ match }) => match)
    }, 'The player registry is unavailable right now')
  }

  /** The admin's club and its association, with the association's administrator and records secretary named. */
  async supportContacts(clubId: string): Promise<ClubAdminSupportContacts> {
    return readOrUnavailable(async () => {
      const club = await this.prisma.club.findUnique({ where: { id: clubId }, include: { association: true } })
      if (!club) return { club: null, association: null }
      const associationId = club.associationId
      const [administratorName, recordsSecretaryName] = await Promise.all([
        roleHolderName(this.prisma, 'ADMINISTRATOR', { associationId }),
        roleHolderName(this.prisma, 'RECORDS_SECRETARY', { associationId }),
      ])
      return {
        club: { clubName: club.name, phone: club.phone, email: club.email, address: club.address },
        association: {
          name: club.association.name, administratorName, recordsSecretaryName,
          phone: club.association.phone, email: club.association.email,
        },
      }
    }, 'Contacts are unavailable right now')
  }

  private clubTeam(team: TeamWithSeason): ClubTeam {
    return {
      id: team.id, name: team.name, sectionId: team.sectionId, sectionName: team.section.name,
      ...this.seasonContext(team.section.season),
    }
  }

  private membership(membership: { status: ClubPlayerMembership['status']; isPrimary: boolean; startDate: Date | null; endDate: Date | null }): ClubPlayerMembership {
    return {
      status: membership.status, isPrimary: membership.isPrimary,
      startDate: calendarDate(membership.startDate), endDate: calendarDate(membership.endDate),
    }
  }

  private seasonContext(season: SeasonWithCompetition) {
    return {
      seasonId: season.id, seasonLabel: seasonLabel(season), seasonStatus: season.status,
      competitionId: season.competitionId, competitionName: season.competition.name,
    }
  }
}
