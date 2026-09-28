import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { DemoEmailGuard } from '../common/guards/demo-email.guard'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({ imports: [PrismaModule], controllers: [DashboardController], providers: [DashboardService, DemoEmailGuard] })
export class DashboardModule {}
