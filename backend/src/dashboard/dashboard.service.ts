import { HttpException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { guardianContact } from '../common/junior-privacy'
import { rubberWinner } from '../common/rubber-winner'
import type { DashboardQueryDto } from './dashboard-query.dto'
import { ageOn, calendarDate, compareDates, inDateRange, melbourneToday, paginate } from './dashboard.query'
import type { BestUtrRank, DashboardData, NotificationItem, Page, ResultItem, ScheduleItem } from './dashboard.types'

const PLAYER_INCLUDE = Prisma.validator<Prisma.PlayerInclude>()({
  clubMemberships: { where: { status: 'ACTIVE' }, include: { club: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  associationMemberships: { where: { status: 'ACTIVE' }, include: { association: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
  teamPlayers: { where: { status: 'ACTIVE' }, include: { team: true }, orderBy: { id: 'asc' } },
  utrLink: true,
})
type Player = Prisma.PlayerGetPayload<{ include: typeof PLAYER_INCLUDE }>

const FIXTURE_INCLUDE = Prisma.validator<Prisma.FixtureInclude>()({
  homeTeam: true, awayTeam: true,
  section: { include: { season: { include: { competition: true } } } },
})
/** Just the id and name of a related record, or null. */
const reference = (value: { id: string; name: string } | null | undefined) => value ? { id: value.id, name: value.name } : null
/** "Round 3" for a round number, or null. */
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
      where: { email }, select: { email: true, profile: { include: PLAYER_INCLUDE } },
    })
    if (!user) throw new NotFoundException({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Account not found' })
    if (!user.profile) throw new NotFoundException({
      statusCode: 404, code: 'PLAYER_PROFILE_NOT_LINKED',
      message: 'Login account found, but it does not have a linked player profile yet.',
    })
    return { player: user.profile, loginEmail: user.email }
  }

  /** Everything the player dashboard shows on first load: profile, next fixtures, recent results, notifications and rating. */
  async dashboard(query: DashboardQueryDto): Promise<DashboardData> {
    const { player, loginEmail } = await this.resolvePlayer(query.email)
    const [fixtures, results, titlesWon, bestUtrRank, notifications] = await Promise.all([
      this.fixtures(player), this.results(player.id), this.titles(player.id), this.bestUtrRank(player.id),
      // The card previews the four newest; View All pages through the rest.
      this.notificationPage(player.userId, { ...query, limit: 4, cursor: undefined }),
    ])
    const club = player.clubMemberships.find(clubMembership => clubMembership.isPrimary)?.club
    const association = player.associationMemberships.find(associationMembership => associationMembership.isPrimary)?.association
    const link = player.utrLink?.status === 'ACTIVE' ? player.utrLink : null
    const birth = calendarDate(player.dateOfBirth)!
    // The aggregate preview always uses default filters so its cursor works on View all.
    const preview: DashboardQueryDto = { email: query.email, limit: 3, scope: 'upcoming', discipline: 'SINGLES', cursor: undefined, from: undefined, to: undefined, competitionId: undefined }
    return {
      profile: {
        id: player.id, code: player.code, avatarUrl: null, displayName: `${player.firstName} ${player.lastName}`.trim(),
        status: player.status, dateOfBirth: birth, age: ageOn(birth, melbourneToday()), gender: player.gender,
        email: loginEmail, phone: player.phone, isJunior: player.isJunior, guardian: guardianContact(player),
        primaryClub: reference(club), primaryAssociation: reference(association),
        clubs: [...player.clubMemberships].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary)).map(membership => reference(membership.club)!),
        teams: player.teamPlayers.map(teamPlayer => reference(teamPlayer.team)!).sort((left, right) => left.name.localeCompare(right.name)),
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

  /** Every fixture of the player's teams, soonest first. */
  async fixtures(player: Player): Promise<ScheduleItem[]> {
    const teamIds = player.teamPlayers.map(teamPlayer => teamPlayer.teamId)
    if (!teamIds.length) return []
    const rows = await this.prisma.fixture.findMany({
      where: { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] },
      include: FIXTURE_INCLUDE,
    })
    return rows.map<ScheduleItem>(row => {
      // If both teams contain this player, do not guess their side.
      const isHome = teamIds.includes(row.homeTeamId), isAway = teamIds.includes(row.awayTeamId)
      const opponent = isHome === isAway ? null : isHome ? row.awayTeam : row.homeTeam
      return {
        id: row.id, kind: 'TEAM_FIXTURE', competition: reference(row.section.season.competition)!,
        event: null, round: round(row.roundNumber), scheduledDate: calendarDate(row.scheduleDate),
        scheduledTime: row.scheduleTime?.toISOString().slice(11, 16) ?? null,
        timeZone: 'Australia/Melbourne', venue: null,
        opponents: opponent ? [{ ...reference(opponent)!, kind: 'TEAM' }] : [],
        participationConfirmed: false, status: row.status, rescheduled: null,
      }
    }).sort((left, right) => compareDates(left.scheduledDate, right.scheduledDate) || compareDates(left.scheduledTime, right.scheduledTime) || left.id.localeCompare(right.id))
  }

  /** The player's finalised rubbers, newest first, from their side of the net. */
  async results(playerId: string): Promise<ResultItem[]> {
    const rows = await this.prisma.rubber.findMany({
      where: { rubberPlayers: { some: { playerId } }, matchResult: { status: 'FINALISED' } },
      include: {
        rubberPlayers: { include: { player: { select: { id: true, firstName: true, lastName: true } } } },
        rubberSets: { orderBy: [{ setNumber: 'asc' }, { id: 'asc' }] },
        matchResult: { include: { fixture: { include: FIXTURE_INCLUDE } } },
      },
    })
    return rows.map<ResultItem>(row => {
      const fixture = row.matchResult.fixture
      const sides = new Set(row.rubberPlayers.filter(rubberPlayer => rubberPlayer.playerId === playerId).map(rubberPlayer => rubberPlayer.side))
      const side = sides.size === 1 ? [...sides][0] : null
      const sets = row.rubberSets.map(rubberSet => ({
        number: rubberSet.setNumber,
        playerGames: side === null ? null : side === 'HOME' ? rubberSet.homeGames : rubberSet.awayGames,
        opponentGames: side === null ? null : side === 'HOME' ? rubberSet.awayGames : rubberSet.homeGames,
      }))
      const completeScore = sets.length && sets.every(setScore => setScore.playerGames !== null && setScore.opponentGames !== null)
      const winner = side === null ? null : rubberWinner(row.winnerSide, row.rubberSets)
      return {
        id: row.id, kind: 'RUBBER', fixtureId: fixture.id, date: calendarDate(fixture.scheduleDate), playedAt: null,
        competition: reference(fixture.section.season.competition)!,
        event: row.rubberType === 'SINGLES' ? 'Singles' : 'Doubles', round: round(fixture.roundNumber),
        opponents: side === null ? [] : row.rubberPlayers.filter(rubberPlayer => rubberPlayer.side !== side).map(rubberPlayer => ({
          id: rubberPlayer.player.id, kind: 'PLAYER', name: `${rubberPlayer.player.firstName} ${rubberPlayer.player.lastName}`.trim(),
        })),
        outcome: winner === null ? null : winner === side ? 'WIN' : 'LOSS', score: completeScore ? sets.map(setScore => `${setScore.playerGames}-${setScore.opponentGames}`).join(' ') : null, sets,
      }
    }).sort((left, right) => compareDates(left.date, right.date, true) || left.id.localeCompare(right.id))
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

  /** One page of fixtures after the scope, competition and date filters. */
  schedulePage(playerId: string, items: ScheduleItem[], query: DashboardQueryDto) {
    const today = melbourneToday()
    const filtered = items.filter(item =>
      (query.scope === 'all' || (item.status === 'SCHEDULED' && (!item.scheduledDate || item.scheduledDate >= today))) &&
      (!query.competitionId || item.competition.id === query.competitionId) && inDateRange(item.scheduledDate, query))
    return paginate(filtered, query.limit, [playerId, 'schedule', query.scope, query.from, query.to, query.competitionId], query.cursor)
  }

  /** One page of results after the competition and date filters. */
  resultPage(playerId: string, items: ResultItem[], query: DashboardQueryDto) {
    const filtered = items.filter(item => (!query.competitionId || item.competition.id === query.competitionId) && inDateRange(item.date, query))
    return paginate(filtered, query.limit, [playerId, 'results', query.from, query.to, query.competitionId], query.cursor)
  }

  /** The player's schedule page (GET /schedule). */
  async schedule(query: DashboardQueryDto) {
    const { player } = await this.resolvePlayer(query.email)
    return this.schedulePage(player.id, await this.fixtures(player), query)
  }

  /** The player's results page (GET /results). */
  async resultList(query: DashboardQueryDto) {
    const { player } = await this.resolvePlayer(query.email)
    return this.resultPage(player.id, await this.results(player.id), query)
  }

  /** The player's in-app notifications, newest first, with the total unread count. */
  async notifications(query: DashboardQueryDto) {
    const { player } = await this.resolvePlayer(query.email)
    return this.notificationPage(player.userId, query)
  }

  /**
   * One page of a login's IN_APP notifications. EMAIL rows are the same events
   * delivered by mail, so they are never listed or counted as unread.
   */
  async notificationPage(userId: string | null, query: DashboardQueryDto): Promise<Page<NotificationItem> & { unreadCount: number }> {
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

  /**
   * An honest "not available" for data the platform does not have yet (UTR history), after
   * checking the email belongs to a real player so unknown emails still get a 404.
   */
  async unavailable(query: DashboardQueryDto) {
    await this.resolvePlayer(query.email)
    return { available: false as const, items: [], nextCursor: null, hasMore: false }
  }
}
