import { ageOn } from '../dashboard/dashboard.query'

/**
 * What each viewer may see of a junior (a player under 18). Every route that
 * shows a junior goes through these helpers, so the rules live in one place;
 * docs/junior-privacy.md is the rulebook they implement:
 *
 *   the junior, or their parent on the junior's login   their own details
 *   the manager of a team the junior is on              the name, and the parent's contact
 *   an administrator of the junior's club               every detail
 *   an administrator of another club                    the name only; a registry search
 *                                                       says whether a typed date of birth
 *                                                       or email matches, never what it is
 *   the association's administrator                     every detail, with age and eligibility
 *   other players                                       the name only, on a shared team list
 */
export interface GuardianContact {
  name: string | null
  email: string | null
  phone: string | null
}

interface GuardianFields {
  isJunior: boolean
  guardianName: string | null
  guardianEmail: string | null
  guardianPhone: string | null
}

/** A junior's parent or guardian; null for an adult, or for a junior with none recorded. */
export function guardianContact(player: GuardianFields): GuardianContact | null {
  if (!player.isJunior) return null
  const { guardianName: name, guardianEmail: email, guardianPhone: phone } = player
  return name || email || phone ? { name, email, phone } : null
}

export interface SectionEligibility {
  // The section's age limits, both inclusive; null where the section sets none.
  minAge: number | null
  maxAge: number | null
  // The player's age on the season's first day; null while the season has no start date.
  ageOnSeasonStart: number | null
  // Whether that age is within the limits; null when there is nothing to check against.
  eligible: boolean | null
}

/**
 * Whether a player's age fits a section, taken on the season's first day.
 * "12 & Under" is max_age 12: a player who is 13 on that day is too old.
 */
export function sectionEligibility(
  dateOfBirth: string,
  section: { minAge: number | null; maxAge: number | null },
  seasonStart: string | null,
): SectionEligibility {
  const { minAge, maxAge } = section
  const ageOnSeasonStart = seasonStart ? ageOn(dateOfBirth, seasonStart) : null
  const limited = minAge !== null || maxAge !== null
  const eligible = !limited || ageOnSeasonStart === null
    ? null
    : (minAge === null || ageOnSeasonStart >= minAge) && (maxAge === null || ageOnSeasonStart <= maxAge)
  return { minAge, maxAge, ageOnSeasonStart, eligible }
}
