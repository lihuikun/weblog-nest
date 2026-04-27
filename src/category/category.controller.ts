import {
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { TeamService } from '../team/team.service';

@ApiBearerAuth('bearer')
@UseGuards(AuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly teamService: TeamService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取分类列表' })
  async getCategories(@CurrentUserId() userId: number) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    return this.categoryService.findAll(teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个分类' })
  async getCategoryById(@CurrentUserId() userId: number, @Param('id', ParseIntPipe) id: number) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    return this.categoryService.findOne(teamId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @ApiBody({
    description: '分类的详细数据，包括名称、描述、图片等',
    type: CreateCategoryDto,
  })
  async createCategory(@CurrentUserId() userId: number, @Body() categoryData: CreateCategoryDto) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    return this.categoryService.create(teamId, categoryData);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分类' })
  @ApiBody({
    description: '分类的详细数据，包括名称、描述、图片等',
    type: UpdateCategoryDto,
  })
  async updateCategory(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() categoryData: UpdateCategoryDto,
  ) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    return this.categoryService.update(teamId, id, categoryData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  async deleteCategory(@CurrentUserId() userId: number, @Param('id', ParseIntPipe) id: number) {
    const { teamId } = await this.teamService.getMyTeam(userId);
    return this.categoryService.delete(teamId, id);
  }
}
