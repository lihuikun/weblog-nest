import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interview } from './entities/interview.entity';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Injectable()
export class InterviewService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
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
  ): Promise<{
    items: Partial<Interview>[];
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

    // 排序
    queryBuilder.orderBy('interview.createTime', 'DESC');

    // 分页
    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 移除答案，只在专门的获取答案接口返回
    const itemsWithoutAnswers = items.map(item => {
      const { answer, ...rest } = item;
      return rest;
    });

    return {
      items: itemsWithoutAnswers,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number): Promise<Partial<Interview>> {
    const interview = await this.interviewRepository.findOne({
      where: { id },
    });

    if (!interview) {
      throw new NotFoundException(`面试题 #${id} 不存在`);
    }

    // 移除答案，只在专门的获取答案接口返回
    const { answer, ...interviewWithoutAnswer } = interview;
    
    // 增加浏览次数
    await this.interviewRepository.increment({ id }, 'viewCount', 1);
    interviewWithoutAnswer.viewCount += 1;

    return interviewWithoutAnswer;
  }

  async getAnswer(id: number, isPremium: boolean): Promise<string | null> {
    const interview = await this.interviewRepository.findOne({
      where: { id },
      select: ['answer', 'requirePremium'],
    });

    if (!interview) {
      throw new NotFoundException(`面试题 #${id} 不存在`);
    }

    // 如果需要会员权限，但用户不是会员，则不返回答案
    if (interview.requirePremium && !isPremium) {
      return null;
    }

    return interview.answer;
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