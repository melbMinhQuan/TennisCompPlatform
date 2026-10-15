import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ClubAdminEditService } from './club-admin-edit.service'
import { AddTeamPlayersDto, AssignManagerDto, CreatePlayerDto, CreateTeamDto, RegistrySearchDto } from './club-admin.dto'
import { AdminClubId, AdminUserId, ClubAdminGuard } from './club-admin.guard'
import { ClubAdminService } from './club-admin.service'

/**
 * The club admin's view of their own club, and the changes they make to it.
 * Every route answers { data }, and the club comes from the admin's role, so
 * no route takes a club ID.
 */
@Controller('api/v1/club-admin')
@UseGuards(ClubAdminGuard)
export class ClubAdminController {
  constructor(
    private readonly clubAdmin: ClubAdminService,
    private readonly edits: ClubAdminEditService,
  ) {}

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

  @Get('open-sections')
  async getOpenSections(@AdminClubId() clubId: string) {
    return { data: await this.clubAdmin.openSections(clubId) }
  }

  @Get('registry/players')
  async searchRegistry(@AdminClubId() clubId: string, @Query() search: RegistrySearchDto) {
    return { data: await this.clubAdmin.searchRegistry(clubId, search) }
  }

  @Post('teams')
  async createTeam(@AdminClubId() clubId: string, @AdminUserId() userId: string, @Body() input: CreateTeamDto) {
    return { data: await this.edits.createTeam(clubId, userId, input) }
  }

  @Post('teams/:teamId/players')
  @HttpCode(200)
  async addTeamPlayers(
    @AdminClubId() clubId: string, @AdminUserId() userId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string, @Body() input: AddTeamPlayersDto,
  ) {
    return { data: await this.edits.addTeamPlayers(clubId, userId, teamId, input) }
  }

  @Delete('teams/:teamId/players/:playerId')
  async removeTeamPlayer(
    @AdminClubId() clubId: string, @AdminUserId() userId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string, @Param('playerId', ParseUUIDPipe) playerId: string,
  ) {
    return { data: await this.edits.removeTeamPlayer(clubId, userId, teamId, playerId) }
  }

  @Put('teams/:teamId/manager')
  async assignManager(
    @AdminClubId() clubId: string, @AdminUserId() userId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string, @Body() input: AssignManagerDto,
  ) {
    return { data: await this.edits.assignManager(clubId, userId, teamId, input.playerId) }
  }

  @Delete('teams/:teamId/manager')
  async removeManager(@AdminClubId() clubId: string, @AdminUserId() userId: string, @Param('teamId', ParseUUIDPipe) teamId: string) {
    return { data: await this.edits.removeManager(clubId, userId, teamId) }
  }

  @Post('players')
  async createPlayer(@AdminClubId() clubId: string, @AdminUserId() userId: string, @Body() input: CreatePlayerDto) {
    return { data: await this.edits.createPlayer(clubId, userId, input) }
  }

  @Post('players/:playerId/membership')
  async addMember(@AdminClubId() clubId: string, @AdminUserId() userId: string, @Param('playerId', ParseUUIDPipe) playerId: string) {
    return { data: await this.edits.addMember(clubId, userId, playerId) }
  }
}
