/**
 * Response shapes for /api/v1/player. Each mirrors the frontend contract of the
 * same name in frontend/api/ (and frontend/types/competition.ts), so the pages
 * render these without mapping. Change both sides together.
 */
export type SeasonStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type MembershipStatus = 'ACTIVE' | 'INACTIVE'

export interface PlayerIdentity {
  id: string
  displayName: string
}

export interface NextFixture {
  id: string
  round: number | null
  /** Finals have no round number, only a label such as "Grand Final". */
  roundLabel: string | null
  homeTeam: string
  awayTeam: string
  date: string | null
  time: string | null
  timeZone: string
  side: 'Home' | 'Away'
  venue: string | null
  address: string | null
}

/** One team the player is registered in; `id` is the team ID. */
export interface CompetitionEntry {
  id: string
  competitionId: string
  name: string
  association: string
  season: string
  section: string
  seasonStatus: SeasonStatus
  player: { id: string; name: string }
  club: string
  team: string
  format: string
  nextFixture: NextFixture | null
}

export interface MatchFixture {
  id: string
  competitionEntryId: string
  competition: string
  season: string
  association: string
  section: string
  format: string
  round: number | null
  /** Finals have no round number, only a label such as "Grand Final". */
  roundLabel: string | null
  homeTeam: string
  awayTeam: string
  club: string
  team: string
  date: string | null
  time: string | null
  side: 'Home' | 'Away'
  status: 'Scheduled' | 'Postponed' | 'Completed' | 'Cancelled'
  venue: string | null
  address: string | null
}

/** A finalised rubber the player played in. Scores are from the player's side. */
export interface MatchResult {
  id: string
  competition: string
  round: number | null
  /** Finals have no round number, only a label such as "Grand Final". */
  roundLabel: string | null
  date: string
  discipline: 'Singles' | 'Doubles'
  players: string[]
  opponents: string[]
  club: string
  team: string
  section: string
  result: 'W' | 'L' | 'D'
  sets: { playerGames: number; opponentGames: number }[]
}

interface Membership {
  id: string
  isPrimary: boolean
  status: MembershipStatus
  startDate: string | null
  endDate: string | null
}

export interface MembershipTeam {
  id: string
  name: string
  clubId: string
  competitionName: string
  seasonLabel: string
  seasonStatus: SeasonStatus
  sectionName: string
}

export interface PlayerMemberships {
  player: PlayerIdentity
  associations: (Membership & { associationId: string; name: string })[]
  clubs: (Membership & { clubId: string; associationId: string; associationName: string; name: string })[]
  teams: MembershipTeam[]
}

export interface TeamDetails extends MembershipTeam {
  clubName: string
  associationName: string
  members: { id: string; name: string; status: 'ACTIVE' | 'EMERGENCY' | 'INACTIVE'; isCurrentPlayer: boolean }[]
}

export interface SupportContacts {
  team: {
    teamName: string
    competitionName: string
    seasonLabel: string
    managerName: string | null
    clubName: string
    phone: string | null
    email: string | null
  } | null
  club: {
    clubName: string
    adminName: string | null
    phone: string | null
    email: string | null
    address: string | null
  } | null
  association: {
    name: string
    recordsSecretaryName: string | null
    phone: string | null
    email: string | null
  } | null
}

export interface StandingsData {
  playerId: string
  playerName: string
  myTeamIds: string[]
  sections: {
    id: string
    name: string
    seasonId: string
    seasonLabel: string
    seasonStartDate: string
    seasonStatus: SeasonStatus
    competitionId: string
    competitionName: string
    associationId: string
    associationName: string
  }[]
  ladders: {
    id: string
    sectionId: string
    teamId: string
    name: string
    position: number | null
    played: number
    won: number
    lost: number
    drawn: number
    points: number
    rubbersFor: number
    rubbersAgainst: number
    setsFor: number
    setsAgainst: number
    gamesFor: number
    gamesAgainst: number
    asOf: string
  }[]
  standings: {
    id: string
    sectionId: string
    playerId: string
    name: string
    position: number | null
    played: number
    won: number
    lost: number
    winPercentage: number | null
    setsWon: number
    setsLost: number
    gamesWon: number
    gamesLost: number
    asOf: string
  }[]
  cohorts: { id: string; name: string; description: string | null; associationId: string | null; discipline: string | null }[]
  rankings: {
    id: string
    cohortId: string
    playerId: string
    name: string
    rank: number
    rating: number | null
    percentileRank: number | null
    asOf: string
  }[]
  finals: { sectionId: string; premiersTeamId: string | null; runnersUpTeamId: string | null }[]
}
