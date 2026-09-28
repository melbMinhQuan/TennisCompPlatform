import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { DemoEmailGuard } from '../common/guards/demo-email.guard'
import { parseQuery } from './dashboard.query'
import { DashboardService } from './dashboard.service'

@Controller('api/v1/player-dashboard')
@UseGuards(DemoEmailGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  get(@Query() query: Record<string, unknown>) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.dashboard(parseQuery(query)) }))
  }

  @Get('schedule')
  schedule(@Query() query: Record<string, unknown>) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.schedule(parseQuery(query)) }))
  }

  @Get('results')
  results(@Query() query: Record<string, unknown>) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.resultList(parseQuery(query)) }))
  }

  @Get('notifications')
  notifications(@Query() query: Record<string, unknown>) {
    return this.dashboard.read(async () => ({ data: await this.dashboard.notifications(parseQuery(query)) }))
  }

  @Get('utr-history')
  history(@Query() query: Record<string, unknown>) {
    return this.dashboard.read(async () => {
      const parsed = parseQuery(query)
      return { data: { ...await this.dashboard.unavailable(parsed), discipline: parsed.discipline } }
    })
  }
}
