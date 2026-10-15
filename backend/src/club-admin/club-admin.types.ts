import type { MembershipStatus, NotificationTargetType, NotificationType, PlayerStatus, TeamPlayerStatus } from '@prisma/client'
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

/**
 * A section of an UPCOMING season run by the admin's association, which a new
 * team may enter. teamCount is how many teams have entered so far, from any club.
 */
export interface OpenSection extends ClubSection {
  teamCount: number
}

/**
 * One registry search result. Never carries date of birth or contact details:
 * the matches only say whether what the admin typed agrees with the record.
 */
export interface RegistryMatch {
  id: string
  firstName: string
  lastName: string
  match: {
    // 'exact' when the full name is the same, otherwise why it could be them.
    name: 'exact' | 'similar'
    nameReasons: string[]
    // null when the admin did not give one.
    dateOfBirth: boolean | null
    email: boolean | null
  }
  // An ACTIVE membership of the admin's club, so there is nothing to add.
  inThisClub: boolean
  // Other clubs the player is an active member of, by name.
  otherClubs: string[]
}

/** One of the admin's in-app notices, in the shape the Notifications page uses. */
export interface ClubAdminNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  // "Round 13 · Syndal A vs Glen Waverley A" when the notice is about a fixture; null otherwise.
  match: string | null
  details: Record<string, unknown> | null
  targetType: NotificationTargetType | null
  targetId: string | null
  // Null means unread.
  readAt: string | null
  createdAt: string
}
