import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '获取分类列表' })
  async getCategories() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个分类' })
  async getCategoryById(@Param('id') id: number) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @ApiBody({
    description: '分类的详细数据，包括名称、描述、图片等',
    type: CreateCategoryDto,
  })
  async createCategory(@Body() categoryData: CreateCategoryDto) {
    return this.categoryService.create(categoryData);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分类' })
  @ApiBody({
    description: '分类的详细数据，包括名称、描述、图片等',
    type: UpdateCategoryDto,
  })
  async updateCategory(
    @Param('id') id: number,
    @Body() categoryData: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, categoryData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  async deleteCategory(@Param('id') id: number) {
    return this.categoryService.delete(id);
  }
}
