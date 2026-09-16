import { HttpException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { ageOn, calendarDate, compareDates, DashboardQuery, inDateRange, melbourneToday, paginate } from './dashboard.query'
import type { DashboardData, ResultItem, ScheduleItem } from './dashboard.types'

const playerInclude = Prisma.validator<Prisma.PlayerInclude>()({
  clubMemberships: { where: { status: 'ACTIVE' }, include: { club: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  associationMemberships: { where: { status: 'ACTIVE' }, include: { association: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  teamPlayers: { where: { status: 'ACTIVE' }, include: { team: true }, orderBy: { id: 'asc' } },
  utrLink: true,
})
type Player = Prisma.PlayerGetPayload<{ include: typeof playerInclude }>

const fixtureInclude = Prisma.validator<Prisma.FixtureInclude>()({
  homeTeam: true, awayTeam: true,
  section: { include: { season: { include: { competition: true } } } },
})
const reference = (value: { id: string; name: string } | null | undefined) => value ? { id: value.id, name: value.name } : null
const round = (value: number | null) => value === null ? null : `Round ${value}`

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Translate database failure without leaking queries, connection details or credentials. */
  async read<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation() } catch (error) {
      if (error instanceof HttpException) throw error
      throw new ServiceUnavailableException({ statusCode: 503, code: 'DATA_UNAVAILABLE', message: 'Dashboard data is unavailable right now' })
    }
  }

  /** The demo resolves by email; future auth can call the same player-based methods. */
  async resolvePlayer(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }, select: { email: true, player: { include: playerInclude } },
    })
    if (!user) throw new NotFoundException({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Account not found' })
    if (!user.player) throw new NotFoundException({
      statusCode: 404, code: 'PLAYER_PROFILE_NOT_LINKED',
      message: 'Login account found, but it does not have a linked player profile yet.',
    })
    return { player: user.player, loginEmail: user.email }
  }

  async dashboard(query: DashboardQuery): Promise<DashboardData> {
    const { player, loginEmail } = await this.resolvePlayer(query.email)
    const [fixtures, results] = await Promise.all([this.fixtures(player), this.results(player.id)])
    const club = player.clubMemberships.find(m => m.isPrimary)?.club
    const association = player.associationMemberships.find(m => m.isPrimary)?.association
    const link = player.utrLink?.status === 'ACTIVE' ? player.utrLink : null
    const birth = calendarDate(player.dateOfBirth)!
    // The aggregate preview always uses default filters so its cursor works on View all.
    const preview: DashboardQuery = { email: query.email, limit: 3, scope: 'upcoming', discipline: 'SINGLES', cursor: undefined, from: undefined, to: undefined, competitionId: undefined }
    return {
      profile: {
        id: player.id, avatarUrl: null, displayName: `${player.firstName} ${player.lastName}`.trim(),
        status: player.status, dateOfBirth: birth, age: ageOn(birth, melbourneToday()), gender: player.gender,
        email: player.email ?? loginEmail, phone: player.phone,
        primaryClub: reference(club), primaryAssociation: reference(association),
        teams: player.teamPlayers.map(m => reference(m.team)!).sort((a, b) => a.name.localeCompare(b.name)),
      },
      utr: {
        rating: link?.utrRating === null || !link ? null : Number(link.utrRating),
        discipline: null, category: null, percentileRank: null, cohort: null, rankedAt: null,
        recentScores: [], historyAvailable: false, lastSyncedAt: link?.lastSyncedAt?.toISOString() ?? null,
      },
      notifications: { available: false, items: [], nextCursor: null, hasMore: false, unreadCount: null },
      upcomingMatches: this.schedulePage(player.id, fixtures, preview),
      recentMatches: this.resultPage(player.id, results, preview),
      careerSummary: {
        matchesPlayed: results.length, matchesWon: results.length ? null : 0,
        matchesLost: results.length ? null : 0, unknownOutcomes: results.length,
        winPercentage: null, titlesWon: null, bestUtrRank: null,
      },
      messages: { available: false, unreadCount: null },
    }
  }

  async fixtures(player: Player): Promise<ScheduleItem[]> {
    const teamIds = player.teamPlayers.map(m => m.teamId)
    if (!teamIds.length) return []
    const rows = await this.prisma.fixture.findMany({
      where: { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] },
      include: fixtureInclude,
    })
    return rows.map<ScheduleItem>(f => {
      // If both teams contain this player, do not guess their side.
      const isHome = teamIds.includes(f.homeTeamId), isAway = teamIds.includes(f.awayTeamId)
      const opponent = isHome === isAway ? null : isHome ? f.awayTeam : f.homeTeam
      return {
        id: f.id, kind: 'TEAM_FIXTURE', competition: reference(f.section.season.competition)!,
        event: null, round: round(f.roundNumber), scheduledDate: calendarDate(f.scheduleDate),
        scheduledTime: f.scheduleTime?.toISOString().slice(11, 16) ?? null,
        timeZone: 'Australia/Melbourne', venue: null,
        opponents: opponent ? [{ ...reference(opponent)!, kind: 'TEAM' }] : [],
        participationConfirmed: false, status: f.status, rescheduled: null,
      }
    }).sort((a, b) => compareDates(a.scheduledDate, b.scheduledDate) || compareDates(a.scheduledTime, b.scheduledTime) || a.id.localeCompare(b.id))
  }

  async results(playerId: string): Promise<ResultItem[]> {
    const rows = await this.prisma.rubber.findMany({
      where: { rubberPlayers: { some: { playerId } }, matchResult: { status: 'FINALISED' } },
      include: {
        rubberPlayers: { include: { player: { select: { id: true, firstName: true, lastName: true } } } },
        rubberSets: { orderBy: [{ setNumber: 'asc' }, { id: 'asc' }] },
        matchResult: { include: { fixture: { include: fixtureInclude } } },
      },
    })
    return rows.map<ResultItem>(r => {
      const fixture = r.matchResult.fixture
      const sides = new Set(r.rubberPlayers.filter(p => p.playerId === playerId).map(p => p.side))
      const side = sides.size === 1 ? [...sides][0] : null
      const sets = r.rubberSets.map(s => ({
        number: s.setNumber,
        playerGames: side === null ? null : side === 'HOME' ? s.homeGames : s.awayGames,
        opponentGames: side === null ? null : side === 'HOME' ? s.awayGames : s.homeGames,
      }))
      const completeScore = sets.length && sets.every(s => s.playerGames !== null && s.opponentGames !== null)
      return {
        id: r.id, kind: 'RUBBER', fixtureId: fixture.id, date: calendarDate(fixture.scheduleDate), playedAt: null,
        competition: reference(fixture.section.season.competition)!,
        event: r.rubberType === 'SINGLES' ? 'Singles' : 'Doubles', round: round(fixture.roundNumber),
        opponents: side === null ? [] : r.rubberPlayers.filter(p => p.side !== side).map(p => ({
          id: p.player.id, kind: 'PLAYER', name: `${p.player.firstName} ${p.player.lastName}`.trim(),
        })),
        // The schema has no individual winner and free-text rules are not reliably interpretable.
        outcome: null, score: completeScore ? sets.map(s => `${s.playerGames}-${s.opponentGames}`).join(' ') : null, sets,
      }
    }).sort((a, b) => compareDates(a.date, b.date, true) || a.id.localeCompare(b.id))
  }

  schedulePage(playerId: string, items: ScheduleItem[], query: DashboardQuery) {
    const today = melbourneToday()
    const filtered = items.filter(item =>
      (query.scope === 'all' || (item.status === 'SCHEDULED' && (!item.scheduledDate || item.scheduledDate >= today))) &&
      (!query.competitionId || item.competition.id === query.competitionId) && inDateRange(item.scheduledDate, query))
    return paginate(filtered, query.limit, [playerId, 'schedule', query.scope, query.from, query.to, query.competitionId], query.cursor)
  }

  resultPage(playerId: string, items: ResultItem[], query: DashboardQuery) {
    const filtered = items.filter(item => (!query.competitionId || item.competition.id === query.competitionId) && inDateRange(item.date, query))
    return paginate(filtered, query.limit, [playerId, 'results', query.from, query.to, query.competitionId], query.cursor)
  }

  async schedule(query: DashboardQuery) {
    const { player } = await this.resolvePlayer(query.email)
    return this.schedulePage(player.id, await this.fixtures(player), query)
  }

  async resultList(query: DashboardQuery) {
    const { player } = await this.resolvePlayer(query.email)
    return this.resultPage(player.id, await this.results(player.id), query)
  }

  async unavailable(query: DashboardQuery) {
    await this.resolvePlayer(query.email)
    return { available: false as const, items: [], nextCursor: null, hasMore: false }
  }
}
