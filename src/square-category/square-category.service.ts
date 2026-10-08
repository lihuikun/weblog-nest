import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SquareCategory } from './entities/square-category.entity';
import { CreateSquareCategoryDto } from './dto/create-square-category.dto';
import { UpdateSquareCategoryDto } from './dto/update-square-category.dto';

@Injectable()
export class SquareCategoryService {
  constructor(
    @InjectRepository(SquareCategory)
    private readonly squareCategoryRepository: Repository<SquareCategory>,
  ) {}

  async create(dto: CreateSquareCategoryDto): Promise<SquareCategory> {
    const existing = await this.squareCategoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('分类名称已存在');
    }
    const category = this.squareCategoryRepository.create(dto);
    return this.squareCategoryRepository.save(category);
  }

  // 广场分类列表（公开），按 sort 升序、id 升序
  async findAll(): Promise<SquareCategory[]> {
    return this.squareCategoryRepository.find({
      order: { sort: 'ASC', id: 'ASC' },
    });
  }

  async update(id: number, dto: UpdateSquareCategoryDto): Promise<SquareCategory> {
    const category = await this.squareCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    if (dto.name && dto.name !== category.name) {
      const existing = await this.squareCategoryRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('分类名称已存在');
      }
    }
    Object.assign(category, dto);
    return this.squareCategoryRepository.save(category);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const result = await this.squareCategoryRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('分类不存在');
    }
    return { success: true };
  }
}
