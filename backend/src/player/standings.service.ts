import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { readOrUnavailable } from '../common/data-unavailable'
import { PlayerLookupService } from './player-lookup.service'
import { calendarDate, decimalNumber, fullName, seasonLabel } from './player-mappers'
import type { StandingsData } from './player.types'

const playerName = { select: { firstName: true, lastName: true } } as const

@Injectable()
export class StandingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookup: PlayerLookupService,
  ) {}

  /**
   * Team ladders, individual standings and UTR rankings for every section that
   * has them, plus the player's own team IDs so the page can highlight them.
   * Positions and points are the stored, already-calculated values; nothing is
   * recalculated here.
   */
  async standings(email: string): Promise<StandingsData> {
    return readOrUnavailable(async () => {
      const player = await this.lookup.findByEmail(email)
      const [myTeams, sections, ladders, standings, cohorts, rankings, awards] = await Promise.all([
        this.prisma.teamPlayer.findMany({ where: { playerId: player.id, status: 'ACTIVE' }, select: { teamId: true } }),
        this.prisma.sectionGrade.findMany({
          where: { OR: [{ ladderEntries: { some: {} } }, { playerStandings: { some: {} } }] },
          include: { season: { include: { competition: { include: { association: true } } } } },
        }),
        this.prisma.ladderEntry.findMany({ include: { team: { select: { name: true } } }, orderBy: [{ sectionId: 'asc' }, { position: 'asc' }] }),
        this.prisma.playerStanding.findMany({ include: { player: playerName }, orderBy: [{ sectionId: 'asc' }, { position: 'asc' }] }),
        // Singles first: the page opens on the first cohort, and singles is the default discipline everywhere else.
        this.prisma.rankingCohort.findMany({ orderBy: [{ discipline: 'asc' }, { name: 'asc' }] }),
        this.prisma.rankingEntry.findMany({ include: { player: playerName }, orderBy: [{ cohortId: 'asc' }, { asOf: 'desc' }, { rank: 'asc' }] }),
        this.prisma.playerAward.findMany({
          where: { awardType: { in: ['SECTION_WINNER', 'RUNNER_UP'] }, teamId: { not: null } },
          select: { awardType: true, teamId: true, team: { select: { sectionId: true } } },
        }),
      ])
      return {
        playerId: player.id,
        playerName: player.displayName,
        myTeamIds: myTeams.map(entry => entry.teamId),
        sections: sections.map(section => ({
          id: section.id, name: section.name, seasonId: section.seasonId,
          seasonLabel: seasonLabel(section.season),
          seasonStartDate: calendarDate(section.season.startDate) ?? '',
          seasonStatus: section.season.status,
          competitionId: section.season.competitionId, competitionName: section.season.competition.name,
          associationId: section.season.competition.associationId, associationName: section.season.competition.association.name,
        })),
        ladders: ladders.map(entry => ({
          id: entry.id, sectionId: entry.sectionId, teamId: entry.teamId, name: entry.team.name,
          position: entry.position, played: entry.played, won: entry.won, lost: entry.lost, drawn: entry.drawn,
          points: entry.points, rubbersFor: entry.rubbersFor, rubbersAgainst: entry.rubbersAgainst,
          setsFor: entry.setsFor, setsAgainst: entry.setsAgainst, gamesFor: entry.gamesFor, gamesAgainst: entry.gamesAgainst,
          asOf: entry.calculatedAt.toISOString(),
        })),
        standings: standings.map(entry => ({
          id: entry.id, sectionId: entry.sectionId, playerId: entry.playerId, name: fullName(entry.player),
          position: entry.position, played: entry.rubbersPlayed, won: entry.rubbersWon, lost: entry.rubbersLost,
          winPercentage: decimalNumber(entry.winPercentage),
          setsWon: entry.setsWon, setsLost: entry.setsLost, gamesWon: entry.gamesWon, gamesLost: entry.gamesLost,
          asOf: entry.calculatedAt.toISOString(),
        })),
        cohorts: cohorts.map(cohort => ({
          id: cohort.id, name: cohort.name, description: cohort.description,
          associationId: cohort.associationId, discipline: cohort.discipline,
        })),
        rankings: rankings.map(entry => ({
          id: entry.id, cohortId: entry.cohortId, playerId: entry.playerId, name: fullName(entry.player),
          rank: entry.rank, rating: decimalNumber(entry.rating), percentileRank: decimalNumber(entry.percentileRank),
          asOf: entry.asOf.toISOString(),
        })),
        finals: this.finals(awards),
      }
    }, 'Standings are unavailable right now')
  }

  /**
   * Premiers and runners-up per section, from the teams holding SECTION_WINNER
   * and RUNNER_UP awards. The Grand Final decides these, not the ladder.
   */
  private finals(awards: { awardType: string; teamId: string | null; team: { sectionId: string } | null }[]): StandingsData['finals'] {
    const bySection = new Map<string, StandingsData['finals'][number]>()
    for (const award of awards) {
      if (!award.team) continue
      const entry = bySection.get(award.team.sectionId) ?? { sectionId: award.team.sectionId, premiersTeamId: null, runnersUpTeamId: null }
      if (award.awardType === 'SECTION_WINNER') entry.premiersTeamId = award.teamId
      else entry.runnersUpTeamId = award.teamId
      bySection.set(entry.sectionId, entry)
    }
    return [...bySection.values()]
  }
}
