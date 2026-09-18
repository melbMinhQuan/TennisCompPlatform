import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { PrismaModule } from './prisma/prisma.module'
import { DashboardModule } from './dashboard/dashboard.module'

@Module({ imports: [PrismaModule, AuthModule, DashboardModule], controllers: [AppController] })
export class AppModule {}
