import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { readOrUnavailable } from '../common/data-unavailable'
import { rubberWinner } from '../common/rubber-winner'
import { PlayerLookupService } from './player-lookup.service'
import { calendarDate, DEFAULT_TIME_ZONE, fullName, localDate } from './player-mappers'
import type { MatchResult } from './player.types'

const sideTeam = { include: { club: true } } as const
const rubberInclude = Prisma.validator<Prisma.RubberInclude>()({
  rubberPlayers: {
    include: { player: { select: { firstName: true, lastName: true } } },
    orderBy: [{ playerOrder: 'asc' }, { id: 'asc' }],
  },
  rubberSets: { orderBy: [{ setNumber: 'asc' }, { id: 'asc' }] },
  matchResult: {
    include: {
      fixture: {
        include: {
          venue: true, homeTeam: sideTeam, awayTeam: sideTeam,
          section: { include: { season: { include: { competition: true } } } },
        },
      },
    },
  },
})
type PlayedRubber = Prisma.RubberGetPayload<{ include: typeof rubberInclude }>

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookup: PlayerLookupService,
  ) {}

  /**
   * The player's finalised rubbers, newest first. A result still awaiting
   * confirmation or under correction is left out, the same rule the ladders use.
   */
  async results(email: string): Promise<MatchResult[]> {
    return readOrUnavailable(async () => {
      const player = await this.lookup.findByEmail(email)
      const rubbers = await this.prisma.rubber.findMany({
        where: { rubberPlayers: { some: { playerId: player.id } }, matchResult: { status: 'FINALISED' } },
        include: rubberInclude,
      })
      return rubbers
        .map(rubber => this.toResult(rubber, player.id))
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
    }, 'Results are unavailable right now')
  }

  /** One rubber as the player saw it: their partners, their opponents and their side's games first. */
  private toResult(rubber: PlayedRubber, playerId: string): MatchResult {
    const fixture = rubber.matchResult.fixture
    const side = rubber.rubberPlayers.find(entry => entry.playerId === playerId)!.side
    const team = side === 'HOME' ? fixture.homeTeam : fixture.awayTeam
    const winner = rubberWinner(rubber.winnerSide, rubber.rubberSets)
    const names = (onPlayerSide: boolean) => rubber.rubberPlayers
      .filter(entry => (entry.side === side) === onPlayerSide)
      .map(entry => fullName(entry.player))
    return {
      id: rubber.id,
      competition: fixture.section.season.competition.name,
      round: fixture.roundNumber,
      roundLabel: fixture.roundLabel,
      date: rubber.playedAt
        ? localDate(rubber.playedAt, fixture.venue?.timeZone ?? DEFAULT_TIME_ZONE)
        : calendarDate(fixture.scheduleDate) ?? '',
      discipline: rubber.rubberType === 'SINGLES' ? 'Singles' : 'Doubles',
      players: names(true),
      opponents: names(false),
      club: team.club.name,
      team: team.name,
      section: fixture.section.name,
      // The frontend has no "unknown" state; an undecidable rubber shows as neither a win nor a loss.
      result: winner === null ? 'D' : winner === side ? 'W' : 'L',
      sets: rubber.rubberSets
        .filter(set => set.homeGames !== null && set.awayGames !== null)
        .map(set => ({
          playerGames: side === 'HOME' ? set.homeGames! : set.awayGames!,
          opponentGames: side === 'HOME' ? set.awayGames! : set.homeGames!,
        })),
    }
  }
}
