import { Controller, Get, UseGuards } from '@nestjs/common'
import { AdminAssociationId, AssociationAdminGuard, AssociationAdminUserId } from './association-admin.guard'
import { AssociationAdminService } from './association-admin.service'

/**
 * The association administrator's pages. Every route answers { data }, and the
 * association comes from the administrator's role, so no route takes its ID.
 */
@Controller('api/v1/association-admin')
@UseGuards(AssociationAdminGuard)
export class AssociationAdminController {
  constructor(private readonly associationAdmin: AssociationAdminService) {}

  @Get('juniors')
  async getJuniors(@AdminAssociationId() associationId: string, @AssociationAdminUserId() userId: string) {
    return { data: await this.associationAdmin.juniors(associationId, userId) }
  }
}
