/** Read-only dashboard contract, also imported as types by the demo frontend. */
export interface Reference { id: string; name: string }
export interface Page<T> {
  available: boolean
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}
export interface ScheduleItem {
  id: string
  kind: 'TEAM_FIXTURE'
  competition: Reference
  event: null
  round: string | null
  scheduledDate: string | null
  scheduledTime: string | null
  timeZone: string
  venue: null
  opponents: (Reference & { kind: 'TEAM' })[]
  participationConfirmed: false
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'| "POSTPONED"
  rescheduled: null
}
/** One in-app notification. `details` depends on `type`; see docs/dashboardapi.md. */
export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  createdAt: string
  readAt: string | null
  details: Record<string, unknown> | null
  target: { type: string; id: string } | null
}
export interface ResultItem {
  id: string
  kind: 'RUBBER'
  fixtureId: string
  date: string | null
  playedAt: null
  competition: Reference
  event: 'Singles' | 'Doubles'
  round: string | null
  opponents: (Reference & { kind: 'PLAYER' })[]
  outcome: 'WIN' | 'LOSS' | null
  score: string | null
  sets: { number: number | null; playerGames: number | null; opponentGames: number | null }[]
}
export interface DashboardData {
  profile: {
    id: string
    avatarUrl: null
    displayName: string
    status: string
    dateOfBirth: string
    age: number
    gender: string
    email: string
    phone: string | null
    primaryClub: Reference | null
    /** Every active club membership, primary first. */
    clubs: Reference[]
    primaryAssociation: Reference | null
    teams: Reference[]
  }
  utr: {
    rating: number | null
    discipline: null
    category: null
    percentileRank: null
    cohort: null
    rankedAt: null
    recentScores: never[]
    historyAvailable: false
    lastSyncedAt: string | null
  }
  notifications: Page<NotificationItem> & { unreadCount: number | null }
  upcomingMatches: Page<ScheduleItem>
  recentMatches: Page<ResultItem>
  careerSummary: {
    matchesPlayed: number
    matchesWon: number | null
    matchesLost: number | null
    unknownOutcomes: number
    winPercentage: number | null
    titlesWon: number | null
    bestUtrRank: null
  }
  messages: { available: false; unreadCount: null }
}
