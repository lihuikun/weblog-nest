import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { RequireRole } from 'src/common/decorators/require-role.decorator';
import { Role } from 'src/user/entities/user.entity';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { checkIsPremium } from 'src/common/decorators/require-premium.decorator';

@ApiTags('面试题')
@Controller('interviews')
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建面试题' })
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  create(@Body() createInterviewDto: CreateInterviewDto) {
    return this.interviewService.create(createInterviewDto);
  }

  @Get()
  @ApiOperation({ summary: '获取面试题列表' })
  @ApiQuery({ name: 'categoryId', required: false, description: '分类ID' })
  @ApiQuery({ name: 'difficulty', required: false, description: '难度等级' })
  async findAll(
    @Pagination() { page, pageSize }: PaginationParams,
    @Query('categoryId') categoryId?: number,
    @Query('difficulty') difficulty?: number,
  ) {
    return this.interviewService.findAll(page, pageSize, categoryId, difficulty);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取面试题详情' })
  @ApiParam({ name: 'id', description: '面试题ID' })
  findOne(@Param('id') id: string) {
    return this.interviewService.findOne(+id);
  }

  @Get(':id/answer')
  @ApiOperation({ summary: '获取面试题答案' })
  @ApiParam({ name: 'id', description: '面试题ID' })
  @UseGuards(AuthGuard)
  async getAnswer(@Param('id') id: string, @Req() req) {
    // 获取用户ID
    const userId = req.user.userId;
    if (!userId) {
      throw new ForbiddenException('用户未登录');
    }

    // 检查用户是否是会员
    const isPremium = await checkIsPremium(userId, this.userRepository);
    
    return {
      answer: await this.interviewService.getAnswer(+id, isPremium),
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新面试题' })
  @ApiParam({ name: 'id', description: '面试题ID' })
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  update(@Param('id') id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
    return this.interviewService.update(+id, updateInterviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除面试题' })
  @ApiParam({ name: 'id', description: '面试题ID' })
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  remove(@Param('id') id: string) {
    return this.interviewService.remove(+id);
  }
} 