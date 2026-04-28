import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { OptionalUserId } from '../common/decorators/optional-user-id.decorator';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuService } from './menu.service';
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

  @Get('square')
  @ApiOperation({ summary: '菜单广场分页列表' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, example: 10, description: '每页条数' })
  @ApiQuery({ name: 'keyword', required: false, example: '鸡', description: '菜名关键词（模糊搜索）' })
  async findSquareMenus(
    @OptionalUserId() userId: number | undefined,
    @Pagination() pagination: PaginationParams,
    @Query('keyword') keyword?: string,
  ) {
    return this.menuService.findSquareMenus(pagination, userId, keyword);
  }

  @Post('square/:id/add')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '将广场菜单添加到当前团队菜单' })
  async addSquareMenuToTeam(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) squareMenuId: number,
  ) {
    return this.menuService.addSquareMenuToTeam(userId, squareMenuId);
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
