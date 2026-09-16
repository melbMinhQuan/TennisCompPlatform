import { CanActivate, Controller, ForbiddenException, Get, Injectable, Query, UseGuards } from '@nestjs/common'
import { parseQuery } from './dashboard.query'
import { DashboardService } from './dashboard.service'

/** Email lookup is a local showcase, not authenticated ownership. */
@Injectable()
export class DashboardDemoGuard implements CanActivate {
  canActivate() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException({ statusCode: 403, code: 'DEMO_DISABLED', message: 'Email-based dashboard access is disabled in production' })
    }
    return true
  }
}

@Controller('api/v1/player-dashboard')
@UseGuards(DashboardDemoGuard)
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
    return this.dashboard.read(async () => ({ data: { ...await this.dashboard.unavailable(parseQuery(query)), unreadCount: null } }))
  }

  @Get('utr-history')
  history(@Query() query: Record<string, unknown>) {
    return this.dashboard.read(async () => {
      const parsed = parseQuery(query)
      return { data: { ...await this.dashboard.unavailable(parsed), discipline: parsed.discipline } }
    })
  }
}
