import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { readOrUnavailable } from '../common/data-unavailable'
import { roleHolderName } from '../common/role-holder'
import { PlayerLookupService } from './player-lookup.service'
import { calendarDate, fullName, seasonLabel } from './player-mappers'
import type { MembershipTeam, PlayerMemberships, SupportContacts, TeamDetails } from './player.types'

const teamInclude = Prisma.validator<Prisma.TeamInclude>()({
  club: { include: { association: true } },
  section: { include: { season: { include: { competition: true } } } },
})
type RosterTeam = Prisma.TeamGetPayload<{ include: typeof teamInclude }>

const oldestFirst = [{ createdAt: 'asc' as const }, { id: 'asc' as const }]

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookup: PlayerLookupService,
  ) {}

  /**
   * The player's association and club memberships (every status, so ended
   * ones can be labelled) and the teams they are actively registered in.
   */
  async memberships(email: string): Promise<PlayerMemberships> {
    return readOrUnavailable(async () => {
      const player = await this.lookup.findByEmail(email)
      const [associations, clubs, teams] = await Promise.all([
        this.prisma.associationMembership.findMany({ where: { playerId: player.id }, include: { association: true }, orderBy: oldestFirst }),
        this.prisma.clubMembership.findMany({ where: { playerId: player.id }, include: { club: { include: { association: true } } }, orderBy: oldestFirst }),
        this.activeTeams(player.id),
      ])
      return {
        player,
        associations: associations.map(membership => ({
          id: membership.id, associationId: membership.associationId, name: membership.association.name,
          isPrimary: membership.isPrimary, status: membership.status,
          // AssociationMembership has no dates, so "Member since" is omitted on the page.
          startDate: null, endDate: null,
        })),
        clubs: clubs.map(membership => ({
          id: membership.id, clubId: membership.clubId, name: membership.club.name,
          associationId: membership.club.associationId, associationName: membership.club.association.name,
          isPrimary: membership.isPrimary, status: membership.status,
          startDate: calendarDate(membership.startDate), endDate: calendarDate(membership.endDate),
        })),
        teams: teams.map(team => this.membershipTeam(team)),
      }
    }, 'Memberships are unavailable right now')
  }

  /**
   * One team's details and roster. Only a player on that roster may see it; any
   * other team answers 404 so its existence is not revealed.
   */
  async teamDetails(email: string, teamId: string): Promise<TeamDetails> {
    return readOrUnavailable(async () => {
      const player = await this.lookup.findByEmail(email)
      const team = await this.prisma.team.findFirst({
        where: { id: teamId, teamPlayers: { some: { playerId: player.id } } },
        include: { ...teamInclude, teamPlayers: { include: { player: { select: { id: true, firstName: true, lastName: true } } } } },
      })
      if (!team) throw new NotFoundException({ statusCode: 404, code: 'TEAM_NOT_FOUND', message: 'Team not found' })
      return {
        ...this.membershipTeam(team),
        clubName: team.club.name,
        associationName: team.club.association.name,
        members: team.teamPlayers.map(entry => ({
          id: entry.player.id, name: fullName(entry.player), status: entry.status, isCurrentPlayer: entry.playerId === player.id,
        })),
      }
    }, 'Team details are unavailable right now')
  }

  /**
   * Who the player should contact: their current-season team's manager, their
   * primary club's administrator and their primary association's records
   * secretary. Volunteers are named only; phone and email are the club's or
   * association's official contacts, never a volunteer's own.
   */
  async supportContacts(email: string): Promise<SupportContacts> {
    return readOrUnavailable(async () => {
      const player = await this.lookup.findByEmail(email)
      const [teams, club, association] = await Promise.all([
        this.activeTeams(player.id),
        this.prisma.clubMembership.findFirst({ where: { playerId: player.id, isPrimary: true, status: 'ACTIVE' }, include: { club: true }, orderBy: oldestFirst }),
        this.prisma.associationMembership.findFirst({ where: { playerId: player.id, isPrimary: true, status: 'ACTIVE' }, include: { association: true }, orderBy: oldestFirst }),
      ])
      // A player can be on several teams at once (two competitions, or two clubs), so list them all.
      const currentTeams = teams.filter(candidate => candidate.section.season.status === 'ACTIVE')
      const [managerNames, adminName, recordsSecretaryName] = await Promise.all([
        Promise.all(currentTeams.map(team => roleHolderName(this.prisma, 'TEAM_MANAGER', { teamId: team.id }))),
        club ? roleHolderName(this.prisma, 'CLUB_ADMIN', { clubId: club.clubId }) : null,
        association ? roleHolderName(this.prisma, 'RECORDS_SECRETARY', { associationId: association.associationId }) : null,
      ])
      const teamContacts = currentTeams.map((team, index) => ({
        teamId: team.id, teamName: team.name, competitionName: team.section.season.competition.name,
        seasonLabel: seasonLabel(team.section.season), managerName: managerNames[index],
        // The club's number, never the volunteer manager's own.
        clubName: team.club.name, phone: team.club.phone, email: team.club.email,
      }))
      return {
        teams: teamContacts,
        team: teamContacts[0] ?? null,
        club: club && {
          clubName: club.club.name, adminName, phone: club.club.phone, email: club.club.email, address: club.club.address,
        },
        association: association && {
          name: association.association.name, recordsSecretaryName,
          phone: association.association.phone, email: association.association.email,
        },
      }
    }, 'Contacts are unavailable right now')
  }

  /** The player's ACTIVE roster places, newest season first. */
  private async activeTeams(playerId: string): Promise<RosterTeam[]> {
    const rows = await this.prisma.teamPlayer.findMany({ where: { playerId, status: 'ACTIVE' }, include: { team: { include: teamInclude } } })
    return rows.map(row => row.team).sort((a, b) =>
      (calendarDate(b.section.season.startDate) ?? '').localeCompare(calendarDate(a.section.season.startDate) ?? '')
      || a.name.localeCompare(b.name))
  }

  /** A team with its competition, season and section, as My Clubs lists it. */
  private membershipTeam(team: RosterTeam): MembershipTeam {
    return {
      id: team.id, name: team.name, clubId: team.clubId,
      competitionName: team.section.season.competition.name,
      seasonLabel: seasonLabel(team.section.season),
      seasonStatus: team.section.season.status,
      sectionName: team.section.name,
    }
  }
}
