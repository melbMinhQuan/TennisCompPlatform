import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { readOrUnavailable } from '../common/data-unavailable'
import { fullName } from '../player/player-mappers'
import { PrismaService } from '../prisma/prisma.service'
import type { AddTeamPlayersDto, CreatePlayerDto, CreateTeamDto } from './club-admin.dto'
import { CLOSED_SEASONS, ClubAdminService, isClubAdmin, playerRole } from './club-admin.service'
import type { ClubPlayerDetail, ClubTeamDetail } from './club-admin.types'
import { isCurrentMembership, localToday } from './membership'

/** Why a player cannot join a squad or manage a team. */
type Ineligible = 'PLAYER_NOT_FOUND' | 'INACTIVE_PLAYER' | 'NOT_CLUB_MEMBER' | 'ALREADY_IN_TEAM' | 'NO_LOGIN_ACCOUNT'

// A user holds one role row. Losing a team-manager role turns it back into a
// plain player role rather than revoking it, so they can still sign in as a player.
const playerRoleData = (grantedAt: Date) => ({
  roleType: 'PLAYER' as const, contextType: 'GLOBAL' as const,
  associationId: null, clubId: null, teamId: null, competitionId: null, grantedAt, revokedAt: null,
})
const managerRoleData = (clubId: string, teamId: string, grantedAt: Date) => ({
  roleType: 'TEAM_MANAGER' as const, contextType: 'TEAM' as const,
  associationId: null, clubId, teamId, competitionId: null, grantedAt, revokedAt: null,
})

const teamNotFound = () => new NotFoundException({ statusCode: 404, code: 'TEAM_NOT_FOUND', message: 'Team not found' })
const playerNotFound = () => new NotFoundException({ statusCode: 404, code: 'PLAYER_NOT_FOUND', message: 'Player not found' })
const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

/** A date-only value for a @db.Date column. */
const dateOnly = (day: string) => new Date(`${day}T00:00:00Z`)

/**
 * The changes a club admin makes to their own club: entering teams, picking
 * squads and managers, and adding players. Every change is checked against the
 * admin's club, written in one transaction and recorded in the audit log.
 * Team changes answer with the team's detail as GET teams/:teamId would.
 */
@Injectable()
export class ClubAdminEditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clubAdmin: ClubAdminService,
  ) {}

  /** Enters a new team in a section of an UPCOMING season run by the club's association. */
  async createTeam(clubId: string, adminUserId: string, input: CreateTeamDto): Promise<ClubTeamDetail> {
    const teamId = await readOrUnavailable(async () => {
      const [club, section] = await Promise.all([
        this.prisma.club.findUnique({ where: { id: clubId }, select: { associationId: true } }),
        this.prisma.sectionGrade.findUnique({ where: { id: input.sectionId }, include: { season: { include: { competition: true } } } }),
      ])
      if (!club || !section || section.season.competition.associationId !== club.associationId) {
        throw new NotFoundException({ statusCode: 404, code: 'SECTION_NOT_FOUND', message: 'Section not found' })
      }
      if (section.season.status !== 'UPCOMING') {
        throw new ConflictException({ statusCode: 409, code: 'SEASON_NOT_OPEN', message: 'This season is not taking new teams' })
      }
      try {
        return await this.prisma.$transaction(async tx => {
          const team = await tx.team.create({
            data: { clubId, sectionId: section.id, seasonId: section.seasonId, name: input.name },
            select: { id: true },
          })
          await this.audit(tx, adminUserId, 'TEAM', team.id, 'CREATE', `Entered ${input.name} in ${section.name}`)
          return team.id
        })
      } catch (error) {
        // team_season_id_name_key: names are unique per season, ignoring case and spaces.
        if (isUniqueViolation(error)) {
          throw new ConflictException({ statusCode: 409, code: 'TEAM_NAME_TAKEN', message: 'A team with this name is already entered in this season' })
        }
        throw error
      }
    }, 'Teams cannot be changed right now')
    return this.clubAdmin.teamDetail(clubId, teamId)
  }

  /**
   * Puts players in the squad as ACTIVE. Each must be an ACTIVE player with a
   * current membership of the club and not already ACTIVE in the squad. One
   * ineligible player refuses the whole request, listing every problem. A
   * player who was INACTIVE or an EMERGENCY becomes ACTIVE again.
   */
  async addTeamPlayers(clubId: string, adminUserId: string, teamId: string, input: AddTeamPlayersDto): Promise<ClubTeamDetail> {
    const playerIds = [...new Set(input.playerIds)]
    await readOrUnavailable(async () => {
      await this.openTeam(clubId, teamId)
      const people = await this.prisma.player.findMany({
        where: { id: { in: playerIds } },
        include: { ...playerRole, clubMemberships: { where: { clubId } }, teamPlayers: { where: { teamId } } },
      })
      const today = localToday()
      const problems = playerIds.flatMap(playerId => {
        const person = people.find(p => p.id === playerId)
        const reason: Ineligible | null =
          !person || person.mergeIntoId || isClubAdmin(person) ? 'PLAYER_NOT_FOUND'
            : person.status !== 'ACTIVE' ? 'INACTIVE_PLAYER'
              : !person.clubMemberships.some(m => isCurrentMembership(m, today)) ? 'NOT_CLUB_MEMBER'
                : person.teamPlayers.some(entry => entry.status === 'ACTIVE') ? 'ALREADY_IN_TEAM'
                  : null
        return reason ? [{ id: playerId, reason }] : []
      })
      if (problems.length) {
        throw new UnprocessableEntityException({
          statusCode: 422, code: 'PLAYERS_NOT_ELIGIBLE', message: 'Some players cannot join this squad', players: problems,
        })
      }
      const registerAt = new Date()
      await this.prisma.$transaction(async tx => {
        for (const playerId of playerIds) {
          await tx.teamPlayer.upsert({
            where: { teamId_playerId: { teamId, playerId } },
            create: { teamId, playerId, status: 'ACTIVE', registerAt },
            update: { status: 'ACTIVE', registerAt },
          })
        }
        const names = playerIds.map(id => fullName(people.find(p => p.id === id)!)).join(', ')
        await this.audit(tx, adminUserId, 'TEAM', teamId, 'ADD_PLAYERS', `Added ${names}`)
      })
    }, 'Squads cannot be changed right now')
    return this.clubAdmin.teamDetail(clubId, teamId)
  }

  /** Takes an ACTIVE player out of the squad. The roster row stays, as INACTIVE, so their history is kept. */
  async removeTeamPlayer(clubId: string, adminUserId: string, teamId: string, playerId: string): Promise<ClubTeamDetail> {
    await readOrUnavailable(async () => {
      await this.openTeam(clubId, teamId)
      const entry = await this.prisma.teamPlayer.findUnique({
        where: { teamId_playerId: { teamId, playerId } },
        include: { player: { select: { firstName: true, lastName: true } } },
      })
      if (entry?.status !== 'ACTIVE') {
        throw new NotFoundException({ statusCode: 404, code: 'PLAYER_NOT_IN_TEAM', message: 'This player is not in the squad' })
      }
      await this.prisma.$transaction(async tx => {
        await tx.teamPlayer.update({ where: { teamId_playerId: { teamId, playerId } }, data: { status: 'INACTIVE' } })
        await this.audit(tx, adminUserId, 'TEAM', teamId, 'REMOVE_PLAYER', `Removed ${fullName(entry.player)}`)
      })
    }, 'Squads cannot be changed right now')
    return this.clubAdmin.teamDetail(clubId, teamId)
  }

  /**
   * Makes a player the team's manager, replacing any current one, who becomes
   * a plain player again. The manager must be an ACTIVE player with a current
   * membership of the club and a login account, since the role belongs to the
   * account. A user holds one role, so someone who already holds another role,
   * or manages a team in a season still running, is refused.
   */
  async assignManager(clubId: string, adminUserId: string, teamId: string, playerId: string): Promise<ClubTeamDetail> {
    await readOrUnavailable(async () => {
      await this.openTeam(clubId, teamId)
      const person = await this.prisma.player.findUnique({
        where: { id: playerId },
        include: { user: { select: { id: true, userRole: true } }, clubMemberships: { where: { clubId } } },
      })
      if (!person || person.mergeIntoId) throw playerNotFound()
      const reason: Ineligible | null =
        person.status !== 'ACTIVE' ? 'INACTIVE_PLAYER'
          : !person.clubMemberships.some(m => isCurrentMembership(m, localToday())) ? 'NOT_CLUB_MEMBER'
            : !person.user ? 'NO_LOGIN_ACCOUNT'
              : null
      if (reason) {
        throw new UnprocessableEntityException({ statusCode: 422, code: 'MANAGER_NOT_ELIGIBLE', message: 'This player cannot manage the team', reason })
      }
      const user = person.user!
      const role = user.userRole?.revokedAt === null ? user.userRole : null
      if (role?.roleType === 'TEAM_MANAGER' && role.teamId === teamId) return
      if (role?.roleType === 'TEAM_MANAGER' && role.teamId && !(await this.seasonClosed(role.teamId))) {
        throw new ConflictException({ statusCode: 409, code: 'MANAGES_ANOTHER_TEAM', message: 'This player already manages another team' })
      }
      if (role && role.roleType !== 'PLAYER' && role.roleType !== 'TEAM_MANAGER') {
        throw new ConflictException({ statusCode: 409, code: 'HOLDS_ANOTHER_ROLE', message: 'This person already holds another role' })
      }
      const now = new Date()
      await this.prisma.$transaction(async tx => {
        await tx.userRole.updateMany({ where: { roleType: 'TEAM_MANAGER', teamId, revokedAt: null }, data: playerRoleData(now) })
        await tx.userRole.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...managerRoleData(clubId, teamId, now) },
          update: managerRoleData(clubId, teamId, now),
        })
        await this.audit(tx, adminUserId, 'TEAM', teamId, 'ASSIGN_MANAGER', `Made ${fullName(person)} team manager`)
      })
    }, 'Team managers cannot be changed right now')
    return this.clubAdmin.teamDetail(clubId, teamId)
  }

  /** Removes the team's manager, who becomes a plain player again. Allowed after the season too, to free them up. */
  async removeManager(clubId: string, adminUserId: string, teamId: string): Promise<ClubTeamDetail> {
    await readOrUnavailable(async () => {
      await this.clubTeam(clubId, teamId)
      await this.prisma.$transaction(async tx => {
        const { count } = await tx.userRole.updateMany({
          where: { roleType: 'TEAM_MANAGER', teamId, revokedAt: null }, data: playerRoleData(new Date()),
        })
        if (!count) throw new NotFoundException({ statusCode: 404, code: 'NO_MANAGER', message: 'This team has no manager' })
        await this.audit(tx, adminUserId, 'TEAM', teamId, 'REMOVE_MANAGER', 'Removed the team manager')
      })
    }, 'Team managers cannot be changed right now')
    return this.clubAdmin.teamDetail(clubId, teamId)
  }

  /**
   * Makes a registered player a member of the club from today, keeping their
   * Player ID and history. An old INACTIVE membership is started again. It is
   * their primary club only when they have no other current primary club.
   */
  async addMember(clubId: string, adminUserId: string, playerId: string): Promise<ClubPlayerDetail> {
    await readOrUnavailable(async () => {
      const person = await this.prisma.player.findUnique({
        where: { id: playerId },
        include: { ...playerRole, clubMemberships: true },
      })
      if (!person || person.mergeIntoId || isClubAdmin(person)) throw playerNotFound()
      const today = localToday()
      if (person.clubMemberships.some(m => m.clubId === clubId && isCurrentMembership(m, today))) {
        throw new ConflictException({ statusCode: 409, code: 'ALREADY_MEMBER', message: 'This player is already a member of your club' })
      }
      const isPrimary = !person.clubMemberships.some(m => m.clubId !== clubId && m.isPrimary && isCurrentMembership(m, today))
      const joined = { status: 'ACTIVE' as const, isPrimary, startDate: dateOnly(today), endDate: null }
      await this.prisma.$transaction(async tx => {
        await tx.clubMembership.upsert({
          where: { playerId_clubId: { playerId, clubId } },
          create: { playerId, clubId, ...joined },
          update: joined,
        })
        await this.audit(tx, adminUserId, 'PLAYER', playerId, 'JOIN_CLUB', `${fullName(person)} joined the club`)
      })
    }, 'Players cannot be added right now')
    return this.clubAdmin.playerDetail(clubId, playerId)
  }

  /**
   * Registers someone new as a member of the club. Refused when a profile with
   * the same name and date of birth exists, so nobody is entered twice; the
   * admin should add that profile instead. Email cannot be set here: it lives
   * on a login account, which the player creates when they sign up.
   */
  async createPlayer(clubId: string, adminUserId: string, input: CreatePlayerDto): Promise<ClubPlayerDetail> {
    const playerId = await readOrUnavailable(async () => {
      const dateOfBirth = dateOnly(input.dateOfBirth)
      const existing = await this.prisma.player.findFirst({
        where: {
          mergeIntoId: null, dateOfBirth,
          firstName: { equals: input.firstName, mode: 'insensitive' },
          lastName: { equals: input.lastName, mode: 'insensitive' },
        },
        select: { id: true },
      })
      if (existing) {
        throw new ConflictException({
          statusCode: 409, code: 'POSSIBLE_DUPLICATE', message: 'A player with this name and date of birth is already registered', playerId: existing.id,
        })
      }
      const today = localToday()
      return this.prisma.$transaction(async tx => {
        const person = await tx.player.create({
          data: {
            firstName: input.firstName, lastName: input.lastName, dateOfBirth, gender: input.gender,
            isJunior: isUnder18(input.dateOfBirth, today), status: 'ACTIVE',
            clubMemberships: { create: { clubId, isPrimary: true, status: 'ACTIVE', startDate: dateOnly(today) } },
          },
          select: { id: true },
        })
        await this.audit(tx, adminUserId, 'PLAYER', person.id, 'CREATE', `Registered ${input.firstName} ${input.lastName}`)
        return person.id
      })
    }, 'Players cannot be added right now')
    return this.clubAdmin.playerDetail(clubId, playerId)
  }

  /** One of the club's teams, or a 404 when it belongs to another club or does not exist. */
  private async clubTeam(clubId: string, teamId: string) {
    const team = await this.prisma.team.findFirst({ where: { id: teamId, clubId }, include: { section: { include: { season: true } } } })
    if (!team) throw teamNotFound()
    return team
  }

  /** One of the club's teams whose season has not finished, so its squad and manager can still change. */
  private async openTeam(clubId: string, teamId: string) {
    const team = await this.clubTeam(clubId, teamId)
    if (CLOSED_SEASONS.includes(team.section.season.status)) {
      throw new ConflictException({ statusCode: 409, code: 'SEASON_CLOSED', message: 'This team\'s season has finished' })
    }
    return team
  }

  private async seasonClosed(teamId: string): Promise<boolean> {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, include: { section: { include: { season: true } } } })
    return !team || CLOSED_SEASONS.includes(team.section.season.status)
  }

  private audit(tx: Prisma.TransactionClient, changedBy: string, entityType: string, entityId: string, action: string, changeSummary: string) {
    return tx.auditLog.create({ data: { entityType, entityId, action, changeSummary, changedBy } })
  }
}

/** Under 18 on the given day, from YYYY-MM-DD dates. */
function isUnder18(dateOfBirth: string, today: string): boolean {
  const [year, ...rest] = dateOfBirth.split('-')
  return `${Number(year) + 18}-${rest.join('-')}` > today
}
