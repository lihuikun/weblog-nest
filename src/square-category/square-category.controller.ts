import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { Role } from '../user/entities/user.entity';
import { CreateSquareCategoryDto } from './dto/create-square-category.dto';
import { UpdateSquareCategoryDto } from './dto/update-square-category.dto';
import { SquareCategoryService } from './square-category.service';

@ApiTags('菜单广场分类')
@Controller('square-category')
export class SquareCategoryController {
  constructor(private readonly squareCategoryService: SquareCategoryService) {}

  @Get()
  @ApiOperation({ summary: '获取广场分类列表（公开）' })
  async findAll() {
    return this.squareCategoryService.findAll();
  }

  @Post()
  @RequireRole(Role.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: '创建广场分类（仅超级管理员）' })
  @ApiBody({ type: CreateSquareCategoryDto })
  async create(@Body() dto: CreateSquareCategoryDto) {
    return this.squareCategoryService.create(dto);
  }

  @Put(':id')
  @RequireRole(Role.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: '更新广场分类（仅超级管理员）' })
  @ApiBody({ type: UpdateSquareCategoryDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSquareCategoryDto,
  ) {
    return this.squareCategoryService.update(id, dto);
  }

  @Delete(':id')
  @RequireRole(Role.ADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: '删除广场分类（仅超级管理员）' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.squareCategoryService.remove(id);
  }
}
