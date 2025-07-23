import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('收藏')
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('interview/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '收藏面试题' })
  toggleInterviewFavorite(
    @Req() req: { user: { userId: number } },
    @Param('id', ParseIntPipe) interviewId: number,
  ) {
    const userId = req.user.userId;
    return this.favoriteService.toggleInterviewFavorite(userId, interviewId);
  }

  @Get('interviews')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '获取用户收藏的面试题' })
  getUserFavoriteInterviews(
    @Req() req: { user: { userId: number } },
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    const userId = req.user.userId;
    return this.favoriteService.getUserFavoriteInterviews(userId, page, pageSize);
  }
}
