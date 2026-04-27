import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { CreateTeamInviteDto } from './dto/create-team-invite.dto';
import { UpdateTeamNameDto } from './dto/update-team-name.dto';
import { TeamService } from './team.service';

@ApiTags('团队管理')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) { }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户团队信息' })
  async getMyTeam(@CurrentUserId() userId: number) {
    return this.teamService.getMyTeam(userId);
  }

  @Post('invites')
  @ApiOperation({ summary: '创建团队邀请短链' })
  @ApiBody({ type: CreateTeamInviteDto })
  async createInvite(
    @CurrentUserId() userId: number,
    @Body() dto: CreateTeamInviteDto,
  ) {
    return this.teamService.createInvite(userId, dto.expireDays);
  }

  @Put('name')
  @ApiOperation({ summary: '修改团队名称（团队成员均可）' })
  @ApiBody({ type: UpdateTeamNameDto })
  async updateTeamName(
    @CurrentUserId() userId: number,
    @Body() dto: UpdateTeamNameDto,
  ) {
    return this.teamService.updateTeamName(userId, dto.teamName);
  }
}
