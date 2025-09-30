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
  Headers,
} from '@nestjs/common';
import { InterviewService } from './interview.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { RequireRole } from 'src/common/decorators/require-role.decorator';
import { Role, User } from 'src/user/entities/user.entity';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { checkIsPremium } from 'src/common/decorators/require-premium.decorator';
import { JwtService } from '@nestjs/jwt';

@ApiTags('面试题')
@Controller('interviews')
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建面试题' })
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  create(@Body() createInterviewDto: CreateInterviewDto) {
    return this.interviewService.create(createInterviewDto);
  }

  @Get()
  @ApiOperation({ summary: '获取面试题列表' })
  @ApiQuery({ name: 'categoryId', required: false, description: '分类ID' })
  @ApiQuery({ name: 'difficulty', required: false, description: '难度等级' })
  @ApiQuery({ name: 'requirePremium', required: false, description: '是否需要会员权限', type: Boolean })
  @ApiBearerAuth()
  async findAll(
    @Pagination() { page, pageSize }: PaginationParams,
    @Query('categoryId') categoryId?: number,
    @Query('difficulty') difficulty?: number,
    @Query('requirePremium') requirePremium?: string,
    @Headers('authorization') authorization?: string,
  ) {
    // 处理字符串转布尔值
    let premiumFilter: boolean | undefined = undefined;
    if (requirePremium === 'true' || requirePremium === '1') {
      premiumFilter = true;
    } else if (requirePremium === 'false' || requirePremium === '0') {
      premiumFilter = false;
    }
    
    // 尝试从 authorization header 获取用户ID
    let userId: number | undefined = undefined;
    if (authorization) {
      try {
        const token = authorization.split(' ')[1];
        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET
        });
        userId = decoded.userId;
        console.log('从token获取到userId', userId);
      } catch (error) {
        console.log('解析token失败', error.message);
        // 解析失败不影响正常使用，只是无法获取会员专属内容
      }
    }
    
    return this.interviewService.findAll(page, pageSize, categoryId, difficulty, premiumFilter, userId);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索面试题' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', example: 'JavaScript闭包' })
  @ApiBearerAuth()
  async search(
    @Query('keyword') keyword: string,
    @Pagination() { page, pageSize }: PaginationParams,
    @Headers('authorization') authorization?: string,
  ) {
    // 尝试从 authorization header 获取用户ID
    let userId: number | undefined = undefined;
    if (authorization) {
      try {
        const token = authorization.split(' ')[1];
        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET
        });
        userId = decoded.userId;
        console.log('从token获取到userId', userId);
      } catch (error) {
        console.log('解析token失败', error.message);
        // 解析失败不影响正常使用，只是无法获取会员专属内容
      }
    }
    
    return this.interviewService.search(keyword, page, pageSize, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取面试题详情' })
  @ApiParam({ name: 'id', description: '面试题ID' })
  @ApiBearerAuth()
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    // 尝试从 authorization header 获取用户ID
    let userId: number | undefined = undefined;
    if (authorization) {
      try {
        const token = authorization.split(' ')[1];
        const decoded = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET
        });
        userId = decoded.userId;
        console.log('从token获取到userId', userId);
      } catch (error) {
        console.log('解析token失败', error.message);
        // 解析失败不影响正常使用，只是无法获取会员专属内容
      }
    }
    
    return this.interviewService.findOne(+id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新面试题' })
  @ApiParam({ name: 'id', description: '面试题ID' })
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
    return this.interviewService.update(+id, updateInterviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除面试题' })
  @ApiParam({ name: 'id', description: '面试题ID' })
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.interviewService.remove(+id);
  }
} 