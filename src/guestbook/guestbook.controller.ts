import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GuestbookService } from './guestbook.service';
import { CreateGuestbookDto } from './dto/create-guestbook.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { Role } from '../user/entities/user.entity';
import { SensitivePipe } from '../common/pipes/sensitive.pipe';
import { Request as ExpressRequest } from 'express';

@ApiTags('留言板管理')
@Controller('guestbook')
export class GuestbookController {
  constructor(private readonly guestbookService: GuestbookService) {}

  @Post()
  @ApiOperation({ summary: '创建留言' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @UsePipes(SensitivePipe)
  async create(
    @Body() createGuestbookDto: CreateGuestbookDto,
    @Req() req: ExpressRequest,
  ) {
    // 获取客户端IP
    const ip = req.headers['x-forwarded-for']?.toString() || 
               req.socket.remoteAddress || 
               'unknown';
    
    return await this.guestbookService.create(createGuestbookDto, ip);
  }

  @Get()
  @ApiOperation({ summary: '获取留言列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(): Promise<{ list: any[]; total: number }> {
    return await this.guestbookService.findAll();
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiOperation({ summary: '删除留言（管理端）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '留言不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiParam({ name: 'id', description: '留言ID' })
  @ApiBearerAuth()
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.guestbookService.remove(id);
    return { message: '删除成功' };
  }
}

