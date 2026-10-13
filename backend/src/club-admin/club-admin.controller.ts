import { Controller, Get, UseGuards } from '@nestjs/common'
import { AdminClubId, ClubAdminGuard } from './club-admin.guard'
import { ClubAdminService } from './club-admin.service'

/**
 * The club admin's view of their own club. Every route answers { data }, and
 * the club comes from the admin's role, so no route takes a club ID.
 */
@Controller('api/v1/club-admin')
@UseGuards(ClubAdminGuard)
export class ClubAdminController {
  constructor(private readonly clubAdmin: ClubAdminService) {}

  @Get('competitions')
  async getCompetitions(@AdminClubId() clubId: string) {
    return { data: await this.clubAdmin.competitions(clubId) }
  }

  @Get('sections')
  async getSections(@AdminClubId() clubId: string) {
    return { data: await this.clubAdmin.sections(clubId) }
  }

  @Get('teams')
  async getTeams(@AdminClubId() clubId: string) {
    return { data: await this.clubAdmin.teams(clubId) }
  }
}
