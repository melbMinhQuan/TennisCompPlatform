import type { MembershipStatus, PlayerStatus, TeamPlayerStatus } from '@prisma/client'
import type { SeasonStatus } from '../player/player.types'

export interface ClubCompetition {
  id: string
  name: string
  type: string | null
  status: 'ACTIVE' | 'ARCHIVED'
}

/** Where a section or team sits: its season and competition. */
interface SeasonContext {
  seasonId: string
  seasonLabel: string
  seasonStatus: SeasonStatus
  competitionId: string
  competitionName: string
}

export interface ClubSection extends SeasonContext {
  id: string
  name: string
  gender: string | null
  ageGroup: string | null
}

export interface ClubTeam extends SeasonContext {
  id: string
  name: string
  sectionId: string
  sectionName: string
}

/** A player's membership of a club, dates as YYYY-MM-DD. */
export interface ClubPlayerMembership {
  status: MembershipStatus
  isPrimary: boolean
  startDate: string | null
  endDate: string | null
}

/** One row of the club's Players list. No date of birth or contact details. */
export interface ClubPlayer {
  id: string
  firstName: string
  lastName: string
  membership: ClubPlayerMembership
  // Names of the club's teams the player is ACTIVE on.
  teamNames: string[]
}

export interface ClubPlayerDetail {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  isJunior: boolean
  email: string | null
  phone: string | null
  status: PlayerStatus
  // Every club the player belongs to, primary first, so the admin can see their home club.
  memberships: (ClubPlayerMembership & { clubId: string; clubName: string })[]
  // Only this club's teams.
  teams: (SeasonContext & { teamId: string; teamName: string; sectionName: string; status: TeamPlayerStatus; registeredAt: string | null })[]
}

export interface ClubTeamDetail extends ClubTeam {
  managerName: string | null
  players: { id: string; firstName: string; lastName: string; status: TeamPlayerStatus; registeredAt: string | null }[]
}

/**
 * Who a club admin contacts for help: their own club's public details and their
 * association's. Volunteers are named only; phone and email are the club's or
 * association's official contacts, never a volunteer's own.
 */
export interface ClubAdminSupportContacts {
  club: {
    clubName: string
    phone: string | null
    email: string | null
    address: string | null
  } | null
  association: {
    name: string
    administratorName: string | null
    recordsSecretaryName: string | null
    phone: string | null
    email: string | null
  } | null
}
