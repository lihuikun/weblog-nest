import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { CreateTeamInviteDto } from './dto/create-team-invite.dto';
import { UpdateTeamNameDto } from './dto/update-team-name.dto';
import { TeamService } from './team.service';
import { CreateCategoryDto } from '../category/dto/create-category.dto';
import { UpdateCategoryDto } from '../category/dto/update-category.dto';

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

  @Get('categories')
  @ApiOperation({ summary: '获取团队菜单分类列表' })
  async getTeamCategories(@CurrentUserId() userId: number) {
    return this.teamService.getTeamCategories(userId);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: '获取团队菜单分类详情' })
  async getTeamCategoryById(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) categoryId: number,
  ) {
    return this.teamService.getTeamCategoryById(userId, categoryId);
  }

  @Post('categories')
  @ApiOperation({ summary: '创建团队菜单分类' })
  @ApiBody({ type: CreateCategoryDto })
  async createTeamCategory(
    @CurrentUserId() userId: number,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.teamService.createTeamCategory(userId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: '更新团队菜单分类' })
  @ApiBody({ type: UpdateCategoryDto })
  async updateTeamCategory(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.teamService.updateTeamCategory(userId, categoryId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: '删除团队菜单分类' })
  async deleteTeamCategory(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) categoryId: number,
  ) {
    return this.teamService.deleteTeamCategory(userId, categoryId);
  }
}
