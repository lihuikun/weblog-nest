import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { User, Role } from 'src/user/entities/user.entity';

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createInterviewDto: CreateInterviewDto): Promise<Interview> {
    const interview = this.interviewRepository.create(createInterviewDto);
    return await this.interviewRepository.save(interview);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    categoryId?: number,
    difficulty?: number,
    requirePremium?: boolean,
    userId?: number,
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
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

    // 处理答案显示逻辑
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

    // 处理答案显示逻辑
    const [processedInterview] = await this.processInterviewAnswers([interview], userId);
    return processedInterview;
  }

  // 处理面试题答案显示逻辑
  private async processInterviewAnswers(interviews: Interview[], userId?: number): Promise<any[]> {
    const answer = `该内容为VIP专享，联系客服即可9.9元开通终身VIP，享受每日更新的面试题库~
    <div style="display: flex;justify-content: center;align-items: center;">
      <img style="width: 200px;" src="https://gitee.com/lihuikun1/pic-bed/raw/master/images/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20250715093516.jpg" alt="">
    </div>
    `
    // 如果没有用户ID，所有需要会员的题目都不返回答案
    console.log('userId', userId)
    if (!userId) {
      return interviews.map(interview => {
        if (interview.requirePremium) {
          return {
            ...interview,
            answer
          };
        }
        return interview;
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
        if (interview.requirePremium) {
          return {
            ...interview,
            answer,
          };
        }
        return interview;
      });
    }

    // 如果是管理员或会员，可以看所有答案
    const canSeeAllAnswers = user.role === Role.ADMIN || user.isPremium;
    console.log("🚀 ~ InterviewService ~ canSeeAllAnswers:", canSeeAllAnswers)
    return interviews.map(interview => {
      // 如果需要会员，且用户不是管理员也不是会员
      if (interview.requirePremium && !canSeeAllAnswers) {
        return {
          ...interview,
          answer,
        };
      }
      // 其他情况保持答案不变
      return interview;
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
} 