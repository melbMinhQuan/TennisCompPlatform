import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
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

  @Get('teams/:teamId')
  async getTeam(@AdminClubId() clubId: string, @Param('teamId', ParseUUIDPipe) teamId: string) {
    return { data: await this.clubAdmin.teamDetail(clubId, teamId) }
  }

  @Get('players')
  async getPlayers(@AdminClubId() clubId: string) {
    return { data: await this.clubAdmin.players(clubId) }
  }

  @Get('players/:playerId')
  async getPlayer(@AdminClubId() clubId: string, @Param('playerId', ParseUUIDPipe) playerId: string) {
    return { data: await this.clubAdmin.playerDetail(clubId, playerId) }
  }

  @Get('support-contacts')
  async getSupportContacts(@AdminClubId() clubId: string) {
    return { data: await this.clubAdmin.supportContacts(clubId) }
  }
}
