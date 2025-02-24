import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('articles/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // 创建顶级评论
  @Post()
  @ApiOperation({ summary: '创建顶级评论' })
  @ApiBody({
    description: '评论的详细数据，包括内容',
    type: CreateCommentDto,
  })
  @UseGuards(AuthGuard)
  async createComment(
    @Req() req: Request,
    @Body() commentData: CreateCommentDto,
  ) {
    const userId = (req as any).user.userId;
    console.log('🚀 ~ CommentController ~ userId:', userId);
    return this.commentService.create(userId, commentData);
  }

  // 删除评论
  @ApiOperation({ summary: '删除评论' })
  @Get(':id')
  async deleteComment(@Param('id') id: number) {
    return this.commentService.delete(id);
  }
}
