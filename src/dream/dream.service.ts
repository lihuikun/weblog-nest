import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dream } from './entities/dream.entity';
import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';
import { AnalyzeDreamDto } from './dto/analyze-dream.dto';
import { SiliconFlowService } from '../siliconflow/siliconflow.service';
@Injectable()
export class DreamService {
  constructor(
    @InjectRepository(Dream)
    private dreamRepository: Repository<Dream>,
    private readonly siliconFlowService: SiliconFlowService,
  ) { }

  async create(createDreamDto: CreateDreamDto, userId: number): Promise<Dream> {
    const dream = this.dreamRepository.create({
      ...createDreamDto,
      userId,
      tags: Array.isArray(createDreamDto.tags) ? createDreamDto.tags : (createDreamDto.tags ? JSON.parse(createDreamDto.tags) : []),
    });
    return this.dreamRepository.save(dream);
  }

  async findAll(userId: number): Promise<Dream[]> {
    return this.dreamRepository.find({
      where: { userId },
      order: { createTime: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Dream> {
    return this.dreamRepository.findOne({
      where: { id, userId },
    });
  }

  async update(
    id: number,
    updateDreamDto: UpdateDreamDto,
    userId: number,
  ): Promise<Dream> {
    const dream = await this.findOne(id, userId);
    if (!dream) {
      throw new Error('梦境记录不存在');
    }

    Object.assign(dream, updateDreamDto);
    return this.dreamRepository.save(dream);
  }

  async remove(id: number, userId: number): Promise<void> {
    const dream = await this.findOne(id, userId);
    if (!dream) {
      throw new Error('梦境记录不存在');
    }

    await this.dreamRepository.remove(dream);
  }

  // 为后期AI分析做准备的方法
  async analyzeWithAI(
    id: number,
    userId: number
  ): Promise<Dream> {
    const dream = await this.findOne(id, userId);
    if (!dream) {
      throw new Error('梦境记录不存在');
    }
    // 调用本地的接口/siliconflow/chat
    const res = await this.siliconFlowService.getChatCompletion({ userInput: `${dream.content},心情：${dream.emotion}` })
    // 将结果更新到梦境的interpretation字段中
    const result = await this.update(id, { interpretation: res }, userId);
    console.log("🚀 ~ DreamService ~ res:", result, res)
    return result;
  }
}
