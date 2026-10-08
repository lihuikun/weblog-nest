import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { OptionalUserId } from '../common/decorators/optional-user-id.decorator';
import { AddSquareMenuDto } from './dto/add-square-menu.dto';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { UpdateMenuSquareCategoryDto } from './dto/update-square-category.dto';
import { MenuService } from './menu.service';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { Role } from '../user/entities/user.entity';
import { Pagination, PaginationParams } from '../common/decorators/pagination.decorator';

@ApiTags('菜单管理')
@ApiBearerAuth('bearer')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '创建菜单' })
  @ApiBody({ type: CreateMenuDto })
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateMenuDto,
  ) {
    return this.menuService.create(userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '获取团队菜单列表' })
  @ApiQuery({ name: 'keyword', required: false, example: '红烧', description: '菜名关键词（模糊搜索）' })
  @ApiQuery({ name: 'categoryId', required: false, example: 1, description: '分类ID（可选）' })
  async findAll(
    @CurrentUserId() userId: number,
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: number,
  ) {
    return this.menuService.findAll(userId, keyword, categoryId);
  }

  @Get('random')
  @ApiOperation({ summary: '随机吃什么（随机返回5个菜品）' })
  async randomFiveMenus(@OptionalUserId() userId: number | undefined) {
    return this.menuService.randomFiveMenus(userId);
  }

  @Get('square')
  @ApiOperation({ summary: '菜单广场分页列表' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, example: 10, description: '每页条数' })
  @ApiQuery({ name: 'keyword', required: false, example: '鸡', description: '菜名关键词（模糊搜索）' })
  @ApiQuery({ name: 'squareCategoryId', required: false, example: 1, description: '广场分类ID（可选）' })
  async findSquareMenus(
    @OptionalUserId() userId: number | undefined,
    @Pagination() pagination: PaginationParams,
    @Query('keyword') keyword?: string,
    @Query('squareCategoryId') squareCategoryId?: number,
  ) {
    return this.menuService.findSquareMenus(pagination, userId, keyword, squareCategoryId);
  }

  @Put('square/:id/category')
  @RequireRole(Role.ADMIN)
  @ApiOperation({ summary: '修改广场菜单的广场分类（仅超级管理员）' })
  @ApiBody({ type: UpdateMenuSquareCategoryDto })
  async updateSquareCategory(
    @Param('id', ParseIntPipe) squareMenuId: number,
    @Body() dto: UpdateMenuSquareCategoryDto,
  ) {
    return this.menuService.updateSquareCategory(squareMenuId, dto.squareCategoryId);
  }

  @Delete('square/:id')
  @RequireRole(Role.ADMIN)
  @ApiOperation({ summary: '删除广场菜单（仅超级管理员）' })
  async removeSquareMenu(@Param('id', ParseIntPipe) squareMenuId: number) {
    return this.menuService.removeSquareMenu(squareMenuId);
  }

  @Post('square/:id/add')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '将广场菜单添加到当前团队菜单（需指定本团队分类）' })
  @ApiBody({ type: AddSquareMenuDto })
  async addSquareMenuToTeam(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) squareMenuId: number,
    @Body() dto: AddSquareMenuDto,
  ) {
    return this.menuService.addSquareMenuToTeam(userId, squareMenuId, dto.categoryId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '获取菜单详情' })
  async findOne(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.menuService.findOne(userId, id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '更新菜单' })
  @ApiBody({ type: UpdateMenuDto })
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuDto,
  ) {
    return this.menuService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '删除菜单' })
  async remove(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.menuService.remove(userId, id);
  }
}
