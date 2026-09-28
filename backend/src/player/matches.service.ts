import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { readOrUnavailable } from '../common/data-unavailable'
import { PlayerLookupService } from './player-lookup.service'
import {
  calendarDate, clockTime, DEFAULT_TIME_ZONE, fixtureStatusLabel, formatLabel, localDate, seasonLabel,
} from './player-mappers'
import type { CompetitionEntry, MatchFixture, NextFixture } from './player.types'

const teamInclude = Prisma.validator<Prisma.TeamInclude>()({
  club: true,
  section: { include: { season: { include: { competition: { include: { association: true } } } } } },
})
type PlayerTeam = Prisma.TeamGetPayload<{ include: typeof teamInclude }>

const fixtureInclude = Prisma.validator<Prisma.FixtureInclude>()({ homeTeam: true, awayTeam: true, venue: true })
type TeamFixture = Prisma.FixtureGetPayload<{ include: typeof fixtureInclude }>

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookup: PlayerLookupService,
  ) {}

  /**
   * Every fixture of every team the player is actively registered in, all
   * statuses, soonest first. They are team fixtures: being on the team does not
   * mean the player is selected to play in it.
   */
  async fixtures(email: string): Promise<MatchFixture[]> {
    return readOrUnavailable(async () => {
      const player = await this.lookup.findByEmail(email)
      const teams = await this.activeTeams(player.id)
      const [fixtures, formats] = await Promise.all([this.teamFixtures(teams), this.sectionFormats(teams)])
      return fixtures.map(fixture => {
        const team = this.ownTeam(fixture, teams)
        return {
          ...this.fixtureCore(fixture, team),
          competitionEntryId: team.id,
          competition: team.section.season.competition.name,
          season: seasonLabel(team.section.season),
          association: team.section.season.competition.association.name,
          section: team.section.name,
          format: formats.get(team.sectionId) ?? formatLabel(null),
          club: team.club.name,
          team: team.name,
          status: fixtureStatusLabel(fixture.status),
        }
      })
    }, 'Fixtures are unavailable right now')
  }

  /**
   * One entry per team the player is actively registered in, with the team's
   * next fixture that is still to be played (null once the season is over).
   */
  async competitions(email: string): Promise<CompetitionEntry[]> {
    return readOrUnavailable(async () => {
      const player = await this.lookup.findByEmail(email)
      const teams = await this.activeTeams(player.id)
      const [fixtures, formats] = await Promise.all([this.teamFixtures(teams), this.sectionFormats(teams)])
      const today = localDate(new Date(), DEFAULT_TIME_ZONE)
      return teams.map(team => {
        const next = fixtures.find(fixture =>
          (fixture.homeTeamId === team.id || fixture.awayTeamId === team.id) &&
          (fixture.status === 'SCHEDULED' || fixture.status === 'POSTPONED') &&
          (fixture.scheduleDate === null || calendarDate(fixture.scheduleDate)! >= today))
        const competition = team.section.season.competition
        return {
          id: team.id,
          competitionId: competition.id,
          name: competition.name,
          association: competition.association.name,
          season: seasonLabel(team.section.season),
          section: team.section.name,
          seasonStatus: team.section.season.status,
          player: { id: player.id, name: player.displayName },
          club: team.club.name,
          team: team.name,
          format: formats.get(team.sectionId) ?? formatLabel(null),
          nextFixture: next ? { ...this.fixtureCore(next, team), timeZone: next.venue?.timeZone ?? DEFAULT_TIME_ZONE } : null,
        }
      })
    }, 'Competitions are unavailable right now')
  }

  /** The player's ACTIVE roster places, newest season first. */
  private async activeTeams(playerId: string): Promise<PlayerTeam[]> {
    const rows = await this.prisma.teamPlayer.findMany({
      where: { playerId, status: 'ACTIVE' },
      include: { team: { include: teamInclude } },
    })
    return rows.map(row => row.team).sort((a, b) =>
      (calendarDate(b.section.season.startDate) ?? '').localeCompare(calendarDate(a.section.season.startDate) ?? '')
      || a.name.localeCompare(b.name))
  }

  /** Every fixture either side of which is one of these teams, soonest first. */
  private async teamFixtures(teams: PlayerTeam[]): Promise<TeamFixture[]> {
    const teamIds = teams.map(team => team.id)
    if (!teamIds.length) return []
    return this.prisma.fixture.findMany({
      where: { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] },
      include: fixtureInclude,
      // Postgres sorts NULL dates last, so a postponed fixture with no new date trails the dated ones.
      orderBy: [{ scheduleDate: 'asc' }, { scheduleTime: 'asc' }, { id: 'asc' }],
    })
  }

  /**
   * Section ID -> format label. Sections have no format column; every rubber
   * in a section is played under the same MatchFormat, so read it from one.
   */
  private async sectionFormats(teams: PlayerTeam[]): Promise<Map<string, string>> {
    const sectionIds = [...new Set(teams.map(team => team.sectionId))]
    const rubbers = await Promise.all(sectionIds.map(sectionId => this.prisma.rubber.findFirst({
      where: { matchFormatId: { not: null }, matchResult: { fixture: { sectionId } } },
      select: { matchFormat: { select: { singlesCount: true, doublesCount: true } } },
    })))
    return new Map(sectionIds.map((sectionId, index) => [sectionId, formatLabel(rubbers[index]?.matchFormat ?? null)]))
  }

  /** The player's side of a fixture. Home wins if they are somehow on both teams. */
  private ownTeam(fixture: TeamFixture, teams: PlayerTeam[]): PlayerTeam {
    return teams.find(team => team.id === fixture.homeTeamId) ?? teams.find(team => team.id === fixture.awayTeamId)!
  }

  /** The fields a fixture card and a competition's "next fixture" share, seen from the player's team. */
  private fixtureCore(fixture: TeamFixture, team: PlayerTeam): Omit<NextFixture, 'timeZone'> & { roundLabel: string | null } {
    return {
      id: fixture.id,
      round: fixture.roundNumber,
      roundLabel: fixture.roundLabel,
      homeTeam: fixture.homeTeam.name,
      awayTeam: fixture.awayTeam.name,
      date: calendarDate(fixture.scheduleDate),
      time: clockTime(fixture.scheduleTime),
      side: team.id === fixture.homeTeamId ? 'Home' : 'Away',
      venue: fixture.venue?.name ?? null,
      address: fixture.venue?.address ?? null,
    }
  }
}
