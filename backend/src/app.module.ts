import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { PrismaModule } from './prisma/prisma.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { UtrModule } from './utr/utr.module'

@Module({ imports: [PrismaModule, AuthModule, DashboardModule, UtrModule], controllers: [AppController] })
export class AppModule {}
