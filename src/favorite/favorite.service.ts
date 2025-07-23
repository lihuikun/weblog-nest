import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Interview } from 'src/interview/entities/interview.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
  ) {}

  async toggleInterviewFavorite(userId: number, interviewId: number): Promise<Favorite | null> {
    // 检查是否已经收藏
    const favorite = await this.favoriteRepository.findOne({
      where: { interviewId, userId },
    });

    if (favorite) {
      // 如果已经收藏，取消收藏
      await this.favoriteRepository.delete({ interviewId, userId });
      await this.interviewRepository.decrement({ id: interviewId }, 'favoriteCount', 1);
      return null; // 返回 null 表示取消收藏
    } else {
      // 如果没有收藏，创建新的收藏记录
      const newFavorite = this.favoriteRepository.create({
        interviewId,
        userId,
      });
      await this.favoriteRepository.save(newFavorite);
      await this.interviewRepository.increment({ id: interviewId }, 'favoriteCount', 1);
      return newFavorite;
    }
  }

  async checkInterviewFavorited(userId: number, interviewId: number): Promise<boolean> {
    const count = await this.favoriteRepository.count({
      where: { userId, interviewId }
    });
    return count > 0;
  }

  async getInterviewFavoriteStatus(userId: number, interviewIds: number[]): Promise<Map<number, boolean>> {
    if (!userId || interviewIds.length === 0) {
      return new Map();
    }

    const favorites = await this.favoriteRepository.find({
      where: {
        userId,
        interviewId: In(interviewIds)
      }
    });
    
    // 映射成查找表以提高性能
    return new Map(favorites.map(fav => [fav.interviewId, true]));
  }

  async getUserFavoriteInterviews(userId: number, page = 1, pageSize = 10): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const skip = (page - 1) * pageSize;
    
    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { userId, interviewId: Not(IsNull()) },
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['interview'],
    });

    const interviews = favorites.map(fav => fav.interview);
    const interviewIds = interviews.map(i => i.id);

    // 批量查点赞
    const likeRepo = this.interviewRepository.manager.getRepository('Like');
    const likes = await likeRepo.find({
      where: { userId, interviewId: In(interviewIds) }
    });
    const likedSet = new Set(likes.map(like => like.interviewId));

    // 组装
    const interviewsWithUser = interviews.map(interview => ({
      ...interview,
      isFavorited: true,
      isLiked: likedSet.has(interview.id),
      likeCount: interview.likeCount ?? 0,
      favoriteCount: interview.favoriteCount ?? 0,
    }));

    return {
      list: interviewsWithUser,
      total,
      page,
      pageSize,
    };
  }
}
