import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ResumeTemplateService } from './resume-template.service';
import { CreateResumeTemplateDto } from './dto/create-resume-template.dto';
import { UpdateResumeTemplateDto } from './dto/update-resume-template.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { RequirePremium } from '../common/decorators/require-premium.decorator';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { OptionalUserId } from '../common/decorators/optional-user-id.decorator';
import { Role } from '../user/entities/user.entity';

@ApiTags('简历模板管理')
@Controller('resume-templates')
export class ResumeTemplateController {
  constructor(private readonly resumeTemplateService: ResumeTemplateService) {}

  @Post()
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({ summary: '创建简历模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiBearerAuth()
  async create(@Body() createResumeTemplateDto: CreateResumeTemplateDto) {
    return await this.resumeTemplateService.create(createResumeTemplateDto);
  }

  @Get()
  @ApiOperation({ summary: '获取模板列表' })
  @ApiQuery({ name: 'type', required: false, description: '模板类型', example: 0, enum: [0, 1] })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiBearerAuth()
  async findAll(
    @OptionalUserId() userId?: number,
    @Query('type') type?: number,
  ) {
    return await this.resumeTemplateService.findAll(userId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取简历模板详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @ApiParam({ name: 'id', description: '模板ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.resumeTemplateService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({ summary: '更新简历模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiParam({ name: 'id', description: '模板ID' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResumeTemplateDto: UpdateResumeTemplateDto,
  ) {
    return await this.resumeTemplateService.update(id, updateResumeTemplateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN)
  @ApiOperation({ summary: '删除简历模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiParam({ name: 'id', description: '模板ID' })
  @ApiBearerAuth()
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.resumeTemplateService.remove(id);
    return { message: '删除成功' };
  }

  @Post(':id/download')
  @UseGuards(AuthGuard)
  @RequirePremium()
  @ApiOperation({ summary: '下载简历模板' })
  @ApiResponse({ status: 200, description: '下载成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiParam({ name: 'id', description: '模板ID' })
  @ApiBearerAuth()
  async downloadTemplate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    const template = await this.resumeTemplateService.download(id, userId);
    
    return {
      message: '下载成功',
      template: {
        id: template.id,
        name: template.name,
        downloadUrl: template.downloadUrl,
        viewCount: template.viewCount,
        downloadCount: template.downloadCount,
      },
    };
  }
}
