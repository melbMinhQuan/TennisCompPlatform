import { Module } from '@nestjs/common'
import { CurrentUserResolver, DemoEmailUserResolver } from '../common/auth/current-user'
import { ClubAdminController } from './club-admin.controller'
import { ClubAdminGuard } from './club-admin.guard'
import { ClubAdminService } from './club-admin.service'

@Module({
  controllers: [ClubAdminController],
  // Swap DemoEmailUserResolver for an Entra External ID resolver once sign-in moves there.
  providers: [{ provide: CurrentUserResolver, useClass: DemoEmailUserResolver }, ClubAdminGuard, ClubAdminService],
})
export class ClubAdminModule {}
