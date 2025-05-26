import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dream } from './entities/dream.entity';
import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';
import { AnalyzeDreamDto } from './dto/analyze-dream.dto';
import { SiliconFlowService } from '../siliconflow/siliconflow.service';
import { UserService } from '../user/user.service';
@Injectable()
export class DreamService {
  constructor(
    @InjectRepository(Dream)
    private dreamRepository: Repository<Dream>,
    private readonly siliconFlowService: SiliconFlowService,
    private readonly userService: UserService,
  ) { }

  async create(createDreamDto: CreateDreamDto, userId: number): Promise<Dream> {
    const dream = this.dreamRepository.create({
      ...createDreamDto,
      userId,
      tags: Array.isArray(createDreamDto.tags) ? createDreamDto.tags : (createDreamDto.tags ? JSON.parse(createDreamDto.tags) : []),
    });
    return this.dreamRepository.save(dream);
  }

  async findAll(isShared: boolean, page: number, pageSize: number): Promise<{ list: Dream[], total: number }> {
    // 默认梦境大厅 查询isShared为true的梦境
    const [list, total] = await this.dreamRepository.findAndCount({
      where: { isShared },
      order: { createTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total };
  }

  async findMy(userId: number, page: number, pageSize: number): Promise<{ list: Dream[], total: number }> {
    // 我的梦境 查询userId为当前用户的梦境
    const [list, total] = await this.dreamRepository.findAndCount({
      where: { userId },
      order: { createTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total };
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
    // 根据userId判断是否是admin
    const role = await this.userService.getUserRole(userId);
    let dream: Dream;
    if (role !== 'admin') {
      dream = await this.findOne(id, userId);
    } else {
      // 管理员可以更新任何梦境
      dream = await this.dreamRepository.findOne({
        where: { id },
      });
    }
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
    // 调用SiliconFlow服务获取AI解读结果
    const interpretation = await this.siliconFlowService.getChatCompletion({
      userInput: `${dream.content},心情：${dream.emotion}`
    });
    console.log("🚀 ~ DreamService ~ interpretation:", interpretation)

    // 将AI解读结果更新到梦境记录中
    const result = await this.update(id, { interpretation }, userId);
    console.log("🚀 ~ DreamService ~ AI解读完成并已保存:", result);
    return result;
  }

  // 支持流式输出的AI分析方法
  async analyzeWithAIStream(
    id: number,
    userId: number,
    onChunk: (chunk: string) => void
  ): Promise<Dream> {
    const dream = await this.findOne(id, userId);
    if (!dream) {
      throw new Error('梦境记录不存在');
    }

    // 调用SiliconFlow服务，传入回调函数进行流式输出
    const interpretation = await this.siliconFlowService.getChatCompletion(
      { userInput: `${dream.content},心情：${dream.emotion}` },
      onChunk
    );
    console.log("🚀 ~ DreamService ~ interpretation:", interpretation)

    // 将AI解读结果更新到梦境记录中
    const result = await this.update(id, { interpretation }, userId);
    console.log("🚀 ~ DreamService ~ AI解读完成并已保存:", result);
    return result;
  }
}
