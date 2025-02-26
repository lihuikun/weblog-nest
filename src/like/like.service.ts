import { Injectable } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';
import { Article } from 'src/article/entities/article.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly articleLikeRepository: Repository<Like>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}
  async toggleLike(userId: number, articleId: number): Promise<Like | null> {
    // 检查是否已经点赞
    const like = await this.articleLikeRepository.findOne({
      where: { articleId, userId },
    });

    if (like) {
      // 如果已经点赞，取消点赞
      await this.articleLikeRepository.delete({ articleId, userId });
      // 更新文章的点赞数量
      await this.updateArticleLikesCount(articleId);
      return null; // 返回 null 表示取消点赞
    } else {
      // 如果没有点赞，创建新的点赞记录
      const newLike = this.articleLikeRepository.create({
        articleId,
        userId,
      });
      await this.articleLikeRepository.save(newLike);
      // 更新文章的点赞数量
      await this.updateArticleLikesCount(articleId);
      return newLike; // 返回新创建的点赞记录
    }
  }
  private async updateArticleLikesCount(articleId: number): Promise<void> {
    // 获取文章的当前点赞数量
    const likeCount = await this.articleLikeRepository.count({
      where: { articleId },
    });

    // 更新文章的点赞数量
    await this.articleRepository.update(articleId, { likeCount });
  }
}
