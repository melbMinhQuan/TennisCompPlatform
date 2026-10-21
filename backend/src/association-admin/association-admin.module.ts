import { Module } from '@nestjs/common'
import { CurrentUserResolver, DemoEmailUserResolver } from '../common/auth/current-user'
import { AssociationAdminController } from './association-admin.controller'
import { AssociationAdminGuard } from './association-admin.guard'
import { AssociationAdminService } from './association-admin.service'

@Module({
  controllers: [AssociationAdminController],
  // Swap DemoEmailUserResolver for an Entra External ID resolver once sign-in moves there, as ClubAdminModule will.
  providers: [{ provide: CurrentUserResolver, useClass: DemoEmailUserResolver }, AssociationAdminGuard, AssociationAdminService],
})
export class AssociationAdminModule {}
