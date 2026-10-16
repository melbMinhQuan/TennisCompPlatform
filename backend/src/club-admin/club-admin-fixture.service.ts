import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { readOrUnavailable } from '../common/data-unavailable'
import { calendarDate, clockTime, fullName, seasonLabel } from '../player/player-mappers'
import { PrismaService } from '../prisma/prisma.service'
import type { ClubAdminFixture } from './club-admin.types'

const side = { select: { id: true, name: true, clubId: true } } as const
const fixtureInclude = Prisma.validator<Prisma.FixtureInclude>()({
  homeTeam: side,
  awayTeam: side,
  venue: { select: { name: true, address: true } },
  section: { include: { season: { include: { competition: { select: { name: true } } } } } },
  _count: { select: { scheduleChanges: true } },
  matchResult: {
    include: {
      rubbers: {
        include: {
          rubberPlayers: { include: { player: { select: { firstName: true, lastName: true } } }, orderBy: [{ playerOrder: 'asc' }, { id: 'asc' }] },
          rubberSets: { orderBy: [{ setNumber: 'asc' }, { id: 'asc' }] },
        },
        orderBy: [{ rubberNumber: 'asc' }, { id: 'asc' }],
      },
    },
  },
})
type ClubFixture = Prisma.FixtureGetPayload<{ include: typeof fixtureInclude }>

/** Fixtures where either side is one of the club's teams. */
const involving = (clubId: string) => ({ OR: [{ homeTeam: { clubId } }, { awayTeam: { clubId } }] })

/**
 * The club admin's fixtures and results: every fixture one of the club's teams
 * plays in, whichever season, with the opponent shown too. Fixtures belong to
 * teams, so the club's players are not involved in choosing them. View only:
 * results are entered and corrected elsewhere.
 */
@Injectable()
export class ClubAdminFixtureService {
  constructor(private readonly prisma: PrismaService) {}

  /** Soonest first; a fixture with no date yet comes last. */
  async list(clubId: string): Promise<ClubAdminFixture[]> {
    return readOrUnavailable(async () => {
      const fixtures = await this.prisma.fixture.findMany({
        where: involving(clubId),
        include: fixtureInclude,
        // Postgres sorts NULL dates last.
        orderBy: [{ scheduleDate: 'asc' }, { scheduleTime: 'asc' }, { id: 'asc' }],
      })
      return fixtures.map(fixture => this.toFixture(fixture, clubId))
    }, 'Fixtures are unavailable right now')
  }

  /** One fixture; one the club does not play in is a 404, the same as one that does not exist. */
  async detail(clubId: string, fixtureId: string): Promise<ClubAdminFixture> {
    return readOrUnavailable(async () => {
      const fixture = await this.prisma.fixture.findFirst({ where: { id: fixtureId, ...involving(clubId) }, include: fixtureInclude })
      if (!fixture) throw new NotFoundException({ statusCode: 404, code: 'FIXTURE_NOT_FOUND', message: 'Fixture not found' })
      return this.toFixture(fixture, clubId)
    }, 'Fixture details are unavailable right now')
  }

  private toFixture(fixture: ClubFixture, clubId: string): ClubAdminFixture {
    const season = fixture.section.season
    const result = fixture.matchResult
    return {
      id: fixture.id,
      clubId,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      competition: season.competition.name,
      seasonId: season.id,
      seasonLabel: seasonLabel(season),
      section: fixture.section.name,
      // A finals fixture has a label and no round number.
      round: fixture.roundLabel ?? (fixture.roundNumber === null ? 'Round to be confirmed' : `Round ${fixture.roundNumber}`),
      date: calendarDate(fixture.scheduleDate),
      time: clockTime(fixture.scheduleTime),
      status: fixture.status,
      changed: fixture._count.scheduleChanges > 0,
      venue: fixture.venue,
      // A DRAFT has not been submitted, so the club sees no result yet.
      result: !result || result.status === 'DRAFT' ? null : {
        status: result.status,
        homeRubbers: result.homeRubbers,
        awayRubbers: result.awayRubbers,
        // Numbers fall back to the position, so a rubber or set missing its number still has one to show.
        rubbers: result.rubbers.map((rubber, index) => ({
          id: rubber.id,
          number: rubber.rubberNumber ?? index + 1,
          type: rubber.rubberType,
          outcome: rubber.outcomeType,
          homePlayers: rubber.rubberPlayers.filter(entry => entry.side === 'HOME').map(entry => fullName(entry.player)),
          awayPlayers: rubber.rubberPlayers.filter(entry => entry.side === 'AWAY').map(entry => fullName(entry.player)),
          sets: rubber.rubberSets.map((set, setIndex) => ({ number: set.setNumber ?? setIndex + 1, home: set.homeGames, away: set.awayGames })),
        })),
      },
    }
  }
}
