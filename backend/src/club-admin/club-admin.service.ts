import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { readOrUnavailable } from '../common/data-unavailable'
import { seasonLabel } from '../player/player-mappers'
import { PrismaService } from '../prisma/prisma.service'
import type { ClubCompetition, ClubSection, ClubTeam } from './club-admin.types'

const seasonInclude = Prisma.validator<Prisma.SeasonInclude>()({ competition: true })
type SeasonWithCompetition = Prisma.SeasonGetPayload<{ include: typeof seasonInclude }>

// Newest season first (by year, then start date); undated seasons sort last.
const newestSeason = [
  { year: { sort: 'desc' as const, nulls: 'last' as const } },
  { startDate: { sort: 'desc' as const, nulls: 'last' as const } },
]

/**
 * What a club admin may see: only competitions, sections and teams their club
 * takes part in. A competition or section counts when at least one of the
 * club's teams is in it.
 */
@Injectable()
export class ClubAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async competitions(clubId: string): Promise<ClubCompetition[]> {
    return readOrUnavailable(async () => {
      const competitions = await this.prisma.competition.findMany({
        where: { seasons: { some: { sections: { some: { teams: { some: { clubId } } } } } } },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      })
      return competitions.map(competition => ({
        id: competition.id, name: competition.name, type: competition.type, status: competition.status,
      }))
    }, 'Competitions are unavailable right now')
  }

  async sections(clubId: string): Promise<ClubSection[]> {
    return readOrUnavailable(async () => {
      const sections = await this.prisma.sectionGrade.findMany({
        where: { teams: { some: { clubId } } },
        include: { season: { include: seasonInclude } },
        orderBy: [...newestSeason.map(season => ({ season })), { name: 'asc' }, { id: 'asc' }],
      })
      return sections.map(section => ({
        id: section.id, name: section.name, gender: section.gender, ageGroup: section.ageGroup,
        ...this.seasonContext(section.season),
      }))
    }, 'Sections are unavailable right now')
  }

  async teams(clubId: string): Promise<ClubTeam[]> {
    return readOrUnavailable(async () => {
      const teams = await this.prisma.team.findMany({
        where: { clubId },
        include: { section: { include: { season: { include: seasonInclude } } } },
        orderBy: [...newestSeason.map(season => ({ section: { season } })), { section: { name: 'asc' } }, { name: 'asc' }, { id: 'asc' }],
      })
      return teams.map(team => ({
        id: team.id, name: team.name, sectionId: team.sectionId, sectionName: team.section.name,
        ...this.seasonContext(team.section.season),
      }))
    }, 'Teams are unavailable right now')
  }

  private seasonContext(season: SeasonWithCompetition) {
    return {
      seasonId: season.id, seasonLabel: seasonLabel(season), seasonStatus: season.status,
      competitionId: season.competitionId, competitionName: season.competition.name,
    }
  }
}
