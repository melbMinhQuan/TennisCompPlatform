import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { DemoEmailGuard } from '../common/guards/demo-email.guard'
import { DashboardQueryDto } from './dashboard-query.dto'
import { DashboardService } from './dashboard.service'

@Controller('api/v1/player-dashboard')
@UseGuards(DemoEmailGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get(@Query() query: DashboardQueryDto) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.dashboard(query) }))
  }

  @Get('schedule')
  schedule(@Query() query: DashboardQueryDto) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.schedule(query) }))
  }

  @Get('results')
  results(@Query() query: DashboardQueryDto) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.resultList(query) }))
  }

  @Get('notifications')
  notifications(@Query() query: DashboardQueryDto) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.notifications(query) }))
  }

  @Get('utr-history')
  history(@Query() query: DashboardQueryDto) {
    return this.dashboard.read(async () => ({ data: { ...await this.dashboard.unavailable(query), discipline: query.discipline } }))
  }
}
