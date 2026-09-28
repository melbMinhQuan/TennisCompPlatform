import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
import { PlayerQueryDto } from '../common/dto/player-query.dto'
import { DemoEmailGuard } from '../common/guards/demo-email.guard'
import { MatchesService } from './matches.service'
import { MembershipsService } from './memberships.service'
import { ResultsService } from './results.service'
import { StandingsService } from './standings.service'

/**
 * The logged-in player's pages. Every route answers { data } and identifies the
 * player by ?email=, the same local demo lookup the dashboard uses.
 */
@Controller('api/v1/player')
@UseGuards(DemoEmailGuard)
export class PlayerController {
  constructor(
    private readonly matches: MatchesService,
    private readonly results: ResultsService,
    private readonly memberships: MembershipsService,
    private readonly standings: StandingsService,
  ) {}

  @Get('competitions')
  async getCompetitions(@Query() query: PlayerQueryDto) {
    return { data: await this.matches.competitions(query.email) }
  }

  @Get('fixtures')
  async getFixtures(@Query() query: PlayerQueryDto) {
    return { data: await this.matches.fixtures(query.email) }
  }

  @Get('results')
  async getResults(@Query() query: PlayerQueryDto) {
    return { data: await this.results.results(query.email) }
  }

  @Get('memberships')
  async getMemberships(@Query() query: PlayerQueryDto) {
    return { data: await this.memberships.memberships(query.email) }
  }

  @Get('teams/:teamId')
  async getTeam(@Param('teamId', ParseUUIDPipe) teamId: string, @Query() query: PlayerQueryDto) {
    return { data: await this.memberships.teamDetails(query.email, teamId) }
  }

  @Get('standings')
  async getStandings(@Query() query: PlayerQueryDto) {
    return { data: await this.standings.standings(query.email) }
  }

  @Get('support-contacts')
  async getSupportContacts(@Query() query: PlayerQueryDto) {
    return { data: await this.memberships.supportContacts(query.email) }
  }
}
