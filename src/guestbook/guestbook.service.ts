import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guestbook } from './entities/guestbook.entity';
import { CreateGuestbookDto } from './dto/create-guestbook.dto';

@Injectable()
export class GuestbookService {
  constructor(
    @InjectRepository(Guestbook)
    private readonly guestbookRepository: Repository<Guestbook>,
  ) {}

  /**
   * 创建留言
   */
  async create(createGuestbookDto: CreateGuestbookDto, ip?: string): Promise<Guestbook> {
    const guestbook = this.guestbookRepository.create({
      ...createGuestbookDto,
      ip: ip || '',
    });
    return await this.guestbookRepository.save(guestbook);
  }

  /**
   * 获取留言列表
   */
  async findAll(): Promise<{ list: Guestbook[]; total: number }> {
    const [list, total] = await this.guestbookRepository.findAndCount({
      where: { isDeleted: false },
      order: { createTime: 'DESC' },
    });

    return { list, total };
  }

  /**
   * 删除留言（管理端）
   */
  async remove(id: number): Promise<void> {
    const guestbook = await this.guestbookRepository.findOne({
      where: { id },
    });

    if (!guestbook) {
      throw new NotFoundException('留言不存在');
    }

    // 软删除
    guestbook.isDeleted = true;
    await this.guestbookRepository.save(guestbook);
  }

  /**
   * 增加点赞数
   */
  async incrementLikeCount(id: number): Promise<void> {
    await this.guestbookRepository.increment({ id }, 'likeCount', 1);
  }
}

