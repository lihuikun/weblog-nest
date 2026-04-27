import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(teamId: number, createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      teamId,
    });
    return await this.categoryRepository.save(category);
  }

  async findAll(teamId: number): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { teamId },
      order: { id: 'DESC' },
    });
  }

  async findOne(teamId: number, id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id, teamId } });
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(
    teamId: number,
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    await this.categoryRepository.update({ id, teamId }, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.findOne({
      where: { id, teamId },
    });
    if (!updatedCategory) {
      throw new Error(`Category with ID ${id} not found`);
    }
    return updatedCategory;
  }

  async delete(teamId: number, id: number): Promise<void> {
    const result = await this.categoryRepository.delete({ id, teamId });
    if (result.affected === 0) {
      throw new Error(`Category with ID ${id} not found`);
    }
  }
}
