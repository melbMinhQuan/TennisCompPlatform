import { Module } from '@nestjs/common'
import { DemoEmailGuard } from '../common/guards/demo-email.guard'
import { MatchesService } from './matches.service'
import { MembershipsService } from './memberships.service'
import { PlayerController } from './player.controller'
import { PlayerLookupService } from './player-lookup.service'
import { ResultsService } from './results.service'
import { StandingsService } from './standings.service'

@Module({
  controllers: [PlayerController],
  providers: [DemoEmailGuard, PlayerLookupService, MatchesService, ResultsService, MembershipsService, StandingsService],
})
export class PlayerModule {}
