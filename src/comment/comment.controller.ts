import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

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
  async createComment(@Body() commentData: CreateCommentDto) {
    return this.commentService.create(commentData);
  }

  // 删除评论
  @ApiOperation({ summary: '删除评论' })
  @Get(':id')
  async deleteComment(@Param('id') id: number) {
    return this.commentService.delete(id);
  }
}
