import { HttpException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { rubberWinner } from '../common/rubber-winner'
import { ageOn, calendarDate, compareDates, DashboardQuery, inDateRange, melbourneToday, paginate } from './dashboard.query'
import type { BestUtrRank, DashboardData, NotificationItem, Page, ResultItem, ScheduleItem } from './dashboard.types'

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
    const [fixtures, results, titlesWon, bestUtrRank, notifications] = await Promise.all([
      this.fixtures(player), this.results(player.id), this.titles(player.id), this.bestUtrRank(player.id),
      // The card previews the four newest; View All pages through the rest.
      this.notificationPage(player.userId, { ...query, limit: 4, cursor: undefined }),
    ])
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
        clubs: [...player.clubMemberships].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map(m => reference(m.club)!),
        teams: player.teamPlayers.map(m => reference(m.team)!).sort((a, b) => a.name.localeCompare(b.name)),
      },
      utr: {
        rating: link?.utrRating === null || !link ? null : Number(link.utrRating),
        discipline: null, category: null, percentileRank: null, cohort: null, rankedAt: null,
        recentScores: [], historyAvailable: false, lastSyncedAt: link?.lastSyncedAt?.toISOString() ?? null,
      },
      notifications,
      upcomingMatches: this.schedulePage(player.id, fixtures, preview),
      recentMatches: this.resultPage(player.id, results, preview),
      careerSummary: this.careerSummary(results, titlesWon, bestUtrRank),
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
      const winner = side === null ? null : rubberWinner(r.winnerSide, r.rubberSets)
      return {
        id: r.id, kind: 'RUBBER', fixtureId: fixture.id, date: calendarDate(fixture.scheduleDate), playedAt: null,
        competition: reference(fixture.section.season.competition)!,
        event: r.rubberType === 'SINGLES' ? 'Singles' : 'Doubles', round: round(fixture.roundNumber),
        opponents: side === null ? [] : r.rubberPlayers.filter(p => p.side !== side).map(p => ({
          id: p.player.id, kind: 'PLAYER', name: `${p.player.firstName} ${p.player.lastName}`.trim(),
        })),
        outcome: winner === null ? null : winner === side ? 'WIN' : 'LOSS', score: completeScore ? sets.map(s => `${s.playerGames}-${s.opponentGames}`).join(' ') : null, sets,
      }
    }).sort((a, b) => compareDates(a.date, b.date, true) || a.id.localeCompare(b.id))
  }

  /**
   * Career numbers over the player's finalised rubbers. Win % stays null while
   * any outcome is unknown, so an undecided rubber is never counted as a loss.
   */
  careerSummary(results: ResultItem[], titlesWon: number, bestUtrRank: BestUtrRank | null = null): DashboardData['careerSummary'] {
    const matchesWon = results.filter(result => result.outcome === 'WIN').length
    const matchesLost = results.filter(result => result.outcome === 'LOSS').length
    const unknownOutcomes = results.length - matchesWon - matchesLost
    return {
      matchesPlayed: results.length, matchesWon, matchesLost, unknownOutcomes,
      winPercentage: results.length && !unknownOutcomes ? Math.round((matchesWon / results.length) * 1000) / 10 : null,
      titlesWon, bestUtrRank,
    }
  }

  /**
   * The highest percentile the player has reached in a singles ranking group
   * (singles is the dashboard's default discipline). Percentiles are only
   * comparable inside one group, so the group comes back with the number.
   * Null when the player has never been ranked.
   */
  async bestUtrRank(playerId: string): Promise<BestUtrRank | null> {
    const best = await this.prisma.rankingEntry.findFirst({
      where: { playerId, percentileRank: { not: null }, cohort: { discipline: 'SINGLES' } },
      include: { cohort: { select: { id: true, name: true, discipline: true } } },
      // On a tie the newest snapshot wins, so the date shown is the latest time it was reached.
      orderBy: [{ percentileRank: 'desc' }, { asOf: 'desc' }, { id: 'asc' }],
    })
    if (!best || best.percentileRank === null) return null
    return {
      percentileRank: Number(best.percentileRank), rank: best.rank,
      cohort: { id: best.cohort.id, name: best.cohort.name }, discipline: best.cohort.discipline,
      recordedAt: best.asOf.toISOString(),
    }
  }

  /** Premierships the player won: section or competition wins. A runners-up award is not a title. */
  async titles(playerId: string): Promise<number> {
    return this.prisma.playerAward.count({ where: { playerId, awardType: { in: ['SECTION_WINNER', 'COMPETITION_WINNER'] } } })
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

  /** The player's in-app notifications, newest first, with the total unread count. */
  async notifications(query: DashboardQuery) {
    const { player } = await this.resolvePlayer(query.email)
    return this.notificationPage(player.userId, query)
  }

  /**
   * One page of a login's IN_APP notifications. EMAIL rows are the same events
   * delivered by mail, so they are never listed or counted as unread.
   */
  async notificationPage(userId: string | null, query: DashboardQuery): Promise<Page<NotificationItem> & { unreadCount: number }> {
    if (!userId) return { available: true, items: [], nextCursor: null, hasMore: false, unreadCount: 0 }
    const where = { userId, channel: 'IN_APP' as const }
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
      this.prisma.notification.count({ where: { ...where, readAt: null } }),
    ])
    const items = rows.map<NotificationItem>(row => ({
      id: row.id, type: row.type, title: row.title, message: row.message,
      createdAt: row.createdAt.toISOString(), readAt: row.readAt?.toISOString() ?? null,
      details: row.details !== null && typeof row.details === 'object' && !Array.isArray(row.details) ? row.details as Record<string, unknown> : null,
      target: row.targetType && row.targetId ? { type: row.targetType, id: row.targetId } : null,
    }))
    return { ...paginate(items, query.limit, [userId, 'notifications'], query.cursor), unreadCount }
  }

  async unavailable(query: DashboardQuery) {
    await this.resolvePlayer(query.email)
    return { available: false as const, items: [], nextCursor: null, hasMore: false }
  }
}
