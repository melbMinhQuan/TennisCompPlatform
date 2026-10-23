/** A player as a scoresheet records them: often a short first name, or no surname at all. */
export interface RecordedPlayer {
  /** As written: "Josh", "J. Smith", "Smith, Josh". */
  name: string
  /** The team they played for, by id or by name. */
  teamId?: string
  teamName?: string
  /** Picks the season, and so which of the team's rosters is searched. */
  matchDate: Date | string
  /** When known: a different date of birth rules a player out. */
  dateOfBirth?: Date | string | null
}

export interface Candidate {
  playerId: string
  name: string
  reasons: string[]
}

export type PlayerMatch =
  | ({ status: 'matched' } & Candidate)
  | { status: 'ambiguous'; candidates: Candidate[] }
  | { status: 'unmatched'; reason: string }

export interface DuplicatePair {
  playerAId: string
  playerBId: string
  names: [string, string]
  dateOfBirth: string
  reasons: string[]
}
