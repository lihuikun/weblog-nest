import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository, In } from 'typeorm';
import { Interview } from 'src/interview/entities/interview.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
  ) {}

  async toggleInterviewLike(userId: number, interviewId: number): Promise<Like | null> {
    // 检查是否已经点赞
    const like = await this.likeRepository.findOne({
      where: { interviewId, userId },
    });

    if (like) {
      // 如果已经点赞，取消点赞
      await this.likeRepository.delete({ interviewId, userId });
      // 更新面试题的点赞数量
      await this.updateInterviewLikesCount(interviewId);
      return null; // 返回 null 表示取消点赞
    } else {
      // 如果没有点赞，创建新的点赞记录
      const newLike = this.likeRepository.create({
        interviewId,
        userId,
      });
      await this.likeRepository.save(newLike);
      // 更新面试题的点赞数量
      await this.updateInterviewLikesCount(interviewId);
      return newLike; // 返回新创建的点赞记录
    }
  }

  async checkInterviewLiked(userId: number, interviewId: number): Promise<boolean> {
    const count = await this.likeRepository.count({
      where: { userId, interviewId }
    });
    return count > 0;
  }

  async getInterviewLikeStatus(userId: number, interviewIds: number[]): Promise<Map<number, boolean>> {
    if (!userId || interviewIds.length === 0) {
      return new Map();
    }

    const likes = await this.likeRepository.find({
      where: {
        userId,
        interviewId: In(interviewIds)
      }
    });
    
    // 映射成查找表以提高性能
    return new Map(likes.map(like => [like.interviewId, true]));
  }

  private async updateInterviewLikesCount(interviewId: number): Promise<void> {
    // 获取面试题的当前点赞数量
    const likeCount = await this.likeRepository.count({
      where: { interviewId },
    });

    // 更新面试题的点赞数量
    await this.interviewRepository.update(interviewId, { likeCount });
  }
}
