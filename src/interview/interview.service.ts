import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { SearchInterviewDto } from './dto/search-interview.dto';
import { User, Role } from 'src/user/entities/user.entity';
import { LikeService } from 'src/like/like.service';
import { FavoriteService } from 'src/favorite/favorite.service';

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly likeService: LikeService,
    private readonly favoriteService: FavoriteService,
  ) {}

  async create(createInterviewDto: CreateInterviewDto): Promise<Interview> {
    const interview = this.interviewRepository.create(createInterviewDto);
    return await this.interviewRepository.save(interview);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    categoryId?: number | string,
    difficulty?: number,
    requirePremium?: boolean,
    userId?: number,
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    // 如果 categoryId === -1，直接返回用户收藏的面试题
    if (categoryId === "-1" && userId) {
      return this.favoriteService.getUserFavoriteInterviews(userId, page, pageSize);
    }
    const queryBuilder = this.interviewRepository.createQueryBuilder('interview');

    // 分类筛选
    if (categoryId) {
      queryBuilder.andWhere('interview.categoryId = :categoryId', { categoryId });
    }

    // 难度筛选
    if (difficulty) {
      queryBuilder.andWhere('interview.difficulty = :difficulty', { difficulty });
    }

    // 会员筛选
    if (requirePremium !== undefined) {
      queryBuilder.andWhere('interview.requirePremium = :requirePremium', { requirePremium: requirePremium ? 1 : 0 });
    }

    // 排序
    queryBuilder.orderBy('interview.createTime', 'DESC');

    // 分页
    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 处理答案显示逻辑和点赞收藏状态
    const processedItems = await this.processInterviewAnswers(items, userId);

    return {
      list: processedItems,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number, userId?: number): Promise<any> {
    const interview = await this.interviewRepository.findOne({
      where: { id },
    });

    if (!interview) {
      throw new NotFoundException(`面试题 #${id} 不存在`);
    }
    
    // 增加浏览次数
    await this.interviewRepository.increment({ id }, 'viewCount', 1);
    interview.viewCount += 1;

    // 获取相邻题目ID
    const adjacentIds = await this.getAdjacentInterviewIds(id);

    // 处理答案显示逻辑和点赞收藏状态
    const [processedInterview] = await this.processInterviewAnswers([interview], userId);
    
    // 追加相邻题目ID信息
    return {
      ...processedInterview,
      previousId: adjacentIds.previous,
      nextId: adjacentIds.next,
    };
  }

  private async getAdjacentInterviewIds(id: number): Promise<{
    previous: number | null;
    next: number | null;
  }> {
    // 获取上一题ID（ID小于当前题目的最大ID）
    const previousInterview = await this.interviewRepository
      .createQueryBuilder('interview')
      .select(['interview.id'])
      .where('interview.id < :id', { id })
      .orderBy('interview.id', 'DESC')
      .limit(1)
      .getOne();

    // 获取下一题ID（ID大于当前题目的最小ID）
    const nextInterview = await this.interviewRepository
      .createQueryBuilder('interview')
      .select(['interview.id'])
      .where('interview.id > :id', { id })
      .orderBy('interview.id', 'ASC')
      .limit(1)
      .getOne();

    return {
      previous: previousInterview?.id || null,
      next: nextInterview?.id || null,
    };
  }

  // 处理面试题答案显示逻辑和用户交互信息
  private async processInterviewAnswers(interviews: Interview[], userId?: number): Promise<any[]> {
    const answer = `该内容为VIP专享，联系客服即可10.9元开通终身VIP，享受每日更新的面试题库，温馨提示:随着题库数量增加会逐步进行涨价,早买早享受哦~
    <div style="display: flex;justify-content: center;align-items: center;">
      <img style="width: 200px;" src="https://gitee.com/lihuikun1/pic-bed/raw/master/images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250715093516.jpg" alt="">
    </div>
    `;
    
    // 获取面试题ID列表
    const interviewIds = interviews.map(interview => interview.id);
    
    // 如果有登录用户，获取点赞和收藏状态
    let likeStatusMap = new Map<number, boolean>();
    let favoriteStatusMap = new Map<number, boolean>();
    
    if (userId && interviewIds.length > 0) {
      likeStatusMap = await this.likeService.getInterviewLikeStatus(userId, interviewIds);
      favoriteStatusMap = await this.favoriteService.getInterviewFavoriteStatus(userId, interviewIds);
    }

    // 如果没有用户ID，所有需要会员的题目都不返回答案
    if (!userId) {
      return interviews.map(interview => {
        const processed = { 
          ...interview,
          isLiked: false,
          isFavorited: false
        };
        
        if (interview.requirePremium) {
          processed.answer = answer;
        }
        
        return processed;
      });
    }

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'isPremium', 'role'],
    });

    // 如果用户不存在，当作非会员处理
    if (!user) {
      return interviews.map(interview => {
        const processed = { 
          ...interview,
          isLiked: likeStatusMap.has(interview.id),
          isFavorited: favoriteStatusMap.has(interview.id)
        };
        
        if (interview.requirePremium) {
          processed.answer = answer;
        }
        
        return processed;
      });
    }

    // 如果是管理员或会员，可以看所有答案
    const canSeeAllAnswers = user.role === Role.ADMIN || user.isPremium;
    
    return interviews.map(interview => {
      const processed = { 
        ...interview,
        isLiked: likeStatusMap.has(interview.id),
        isFavorited: favoriteStatusMap.has(interview.id)
      };
      
      // 如果需要会员，且用户不是管理员也不是会员
      if (interview.requirePremium && !canSeeAllAnswers) {
        processed.answer = answer;
      }
      
      return processed;
    });
  }

  async update(
    id: number,
    updateInterviewDto: UpdateInterviewDto,
  ): Promise<Interview> {
    await this.interviewRepository.update(id, updateInterviewDto);
    const updatedInterview = await this.interviewRepository.findOne({
      where: { id },
    });
    
    if (!updatedInterview) {
      throw new NotFoundException(`面试题 #${id} 不存在`);
    }
    
    return updatedInterview;
  }

  async remove(id: number): Promise<void> {
    const result = await this.interviewRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`面试题 #${id} 不存在`);
    }
  }

  async search(
    searchDto: SearchInterviewDto,
    page: number = 1,
    pageSize: number = 10,
    userId?: number,
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { keyword, categoryId, difficulty, requirePremium } = searchDto;
    
    const queryBuilder = this.interviewRepository.createQueryBuilder('interview');

    // 关键词搜索 - 支持标题和内容模糊搜索
    if (keyword) {
      queryBuilder.andWhere(
        '(interview.title LIKE :keyword OR interview.question LIKE :keyword OR interview.answer LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }

    // 分类筛选
    if (categoryId) {
      queryBuilder.andWhere('interview.categoryId = :categoryId', { categoryId });
    }

    // 难度筛选
    if (difficulty) {
      queryBuilder.andWhere('interview.difficulty = :difficulty', { difficulty });
    }

    // 会员筛选
    if (requirePremium !== undefined) {
      queryBuilder.andWhere('interview.requirePremium = :requirePremium', { 
        requirePremium: requirePremium ? 1 : 0 
      });
    }

    // 排序 - 按创建时间倒序
    queryBuilder.orderBy('interview.createTime', 'DESC');

    // 分页
    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 处理答案显示逻辑和点赞收藏状态
    const processedItems = await this.processInterviewAnswers(items, userId);

    return {
      list: processedItems,
      total,
      page,
      pageSize,
    };
  }
} 