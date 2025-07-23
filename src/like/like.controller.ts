import {
  Controller,
  Post,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('点赞')
@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('interview/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '面试题点赞' })
  toggleInterviewLike(
    @Req() req: { user: { userId: number } },
    @Param('id', ParseIntPipe) interviewId: number,
  ) {
    const userId = req.user.userId;
    return this.likeService.toggleInterviewLike(userId, interviewId);
  }
}
