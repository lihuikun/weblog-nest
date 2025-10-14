import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeTemplate } from './entities/resume-template.entity';
import { CreateResumeTemplateDto } from './dto/create-resume-template.dto';
import { UpdateResumeTemplateDto } from './dto/update-resume-template.dto';
import { checkIsPremium } from '../common/decorators/require-premium.decorator';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ResumeTemplateService {
  constructor(
    @InjectRepository(ResumeTemplate)
    private readonly resumeTemplateRepository: Repository<ResumeTemplate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 创建简历模板
   */
  async create(createResumeTemplateDto: CreateResumeTemplateDto): Promise<ResumeTemplate> {
    const resumeTemplate = this.resumeTemplateRepository.create(createResumeTemplateDto);
    return await this.resumeTemplateRepository.save(resumeTemplate);
  }

  /**
   * 获取简历模板列表（倒序）
   */
  async findAll(userId?: number): Promise<ResumeTemplate[]> {
    const templates = await this.resumeTemplateRepository.find({
      order: { createTime: 'DESC' },
    });

    // 如果没有传入userId，直接去掉下载地址
    if (!userId) {
      templates.forEach(template => {
        template.downloadUrl = undefined;
      });
      return templates;
    }

    // 查询用户角色
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['role']
    });

    // 如果不是admin或subAdmin，去掉下载地址
    if (!user || (user.role !== 'admin' && user.role !== 'subAdmin')) {
      templates.forEach(template => {
        template.downloadUrl = undefined;
      });
    }

    return templates;
  }

  /**
   * 根据ID查询简历模板
   */
  async findOne(id: number): Promise<ResumeTemplate> {
    const template = await this.resumeTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('简历模板不存在');
    }

    // 增加查看次数
    await this.incrementViewCount(id);

    return template;
  }

  /**
   * 更新简历模板
   */
  async update(id: number, updateResumeTemplateDto: UpdateResumeTemplateDto): Promise<ResumeTemplate> {
    const template = await this.resumeTemplateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new NotFoundException('简历模板不存在');
    }

    Object.assign(template, updateResumeTemplateDto);
    return await this.resumeTemplateRepository.save(template);
  }

  /**
   * 删除简历模板
   */
  async remove(id: number): Promise<void> {
    const template = await this.resumeTemplateRepository.findOne({ where: { id } });
    
    if (!template) {
      throw new NotFoundException('简历模板不存在');
    }

    await this.resumeTemplateRepository.remove(template);
  }

  /**
   * 下载简历模板（需要会员权限）
   */
  async download(id: number, userId: number): Promise<ResumeTemplate> {
    const template = await this.resumeTemplateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('简历模板不存在');
    }

    // 检查会员权限
    if (template.isPremium) {
      const isUserPremium = await checkIsPremium(userId, this.userRepository);
      if (!isUserPremium) {
        throw new BadRequestException('权限不足，需要会员权限才能下载此模板');
      }
    }

    // 增加下载次数
    await this.incrementDownloadCount(id);

    return template;
  }

  /**
   * 增加查看次数
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.resumeTemplateRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(id: number): Promise<void> {
    await this.resumeTemplateRepository.increment({ id }, 'downloadCount', 1);
  }
}
