import type { Gender, MembershipStatus, PlayerStatus, TeamPlayerStatus } from '@prisma/client'
import type { GuardianContact, SectionEligibility } from '../common/junior-privacy'
import type { SeasonStatus } from '../player/player.types'

/** A junior's place in a team of one of the association's competitions, with the age check for its section. */
export interface AssociationJuniorTeam extends SectionEligibility {
  teamId: string
  teamName: string
  clubName: string
  competitionName: string
  seasonLabel: string
  seasonStatus: SeasonStatus
  // The season's first day, YYYY-MM-DD, which the age check uses; null while it is not set.
  seasonStart: string | null
  sectionName: string
  status: TeamPlayerStatus
}

/**
 * Every detail of one junior: the association's administrator checks age and
 * eligibility, so nothing is held back (docs/junior-privacy.md).
 */
export interface AssociationJunior {
  id: string
  // The readable Player ID (PLR113); null only for a player added before codes were automatic.
  code: string | null
  firstName: string
  lastName: string
  dateOfBirth: string
  // Whole years, today in Melbourne.
  age: number
  gender: Gender
  status: PlayerStatus
  // The junior's own login and phone.
  email: string | null
  phone: string | null
  guardian: GuardianContact | null
  // Every club the junior belongs to, primary first.
  clubs: { clubId: string; name: string; isPrimary: boolean; status: MembershipStatus }[]
  // Teams in this association's competitions only, newest season first.
  teams: AssociationJuniorTeam[]
}

export interface AssociationJuniors {
  // Today in Melbourne, YYYY-MM-DD: the day `age` is for.
  asOf: string
  association: { id: string; name: string }
  // The administrator's name for the header; their account email when they have no profile.
  adminName: string
  // Members of the association, or of one of its clubs, by surname.
  juniors: AssociationJunior[]
}
