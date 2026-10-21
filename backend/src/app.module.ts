import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AssociationAdminModule } from './association-admin/association-admin.module'
import { AuthModule } from './auth/auth.module'
import { ClubAdminModule } from './club-admin/club-admin.module'
import { PrismaModule } from './prisma/prisma.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { UtrModule } from './utr/utr.module'
import { PlayerModule } from './player/player.module'

@Module({ imports: [PrismaModule, AuthModule, DashboardModule, PlayerModule, ClubAdminModule, AssociationAdminModule, UtrModule], controllers: [AppController] })
export class AppModule {}
