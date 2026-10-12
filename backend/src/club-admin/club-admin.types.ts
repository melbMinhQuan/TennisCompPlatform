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
  seasonStatus: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
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
