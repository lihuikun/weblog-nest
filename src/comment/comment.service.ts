import { Injectable, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  // 创建顶级评论或回复
  async create(
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { content, parentId, articleId } = createCommentDto;
    console.log(
      '🚀 ~ CommentService ~ createCommentDto:',
      createCommentDto,
      userId,
    );
    const comment = this.commentRepository.create({
      content,
      article: { id: articleId }, // 关联文章
      parentComment: parentId ? { id: parentId } : null, // 如果有 parentId，则关联父评论
      user: { id: userId }, // 关联用户
    });

    return await this.commentRepository.save(comment);
  }
  // 删除评论
  async delete(id: number): Promise<void> {
    await this.commentRepository.delete(id);
  }
}
