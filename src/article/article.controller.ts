import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Article } from './entities/article.entity';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: '获取文章列表' })
  async getArticles(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('categoryId') categoryId?: number, // 可选参数
  ) {
    return this.articleService.findAll(page, pageSize, categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单篇文章' })
  async getArticleById(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Param('id') id: number,
  ) {
    return this.articleService.findOne(id, page, pageSize);
  }

  @Put(':id') // 使用 PUT 方法表示更新操作
  @ApiOperation({ summary: '更新文章' })
  @ApiBody({
    description: '文章的详细数据，包括标题、内容、封面等',
    type: UpdateArticleDto,
  })
  @ApiParam({
    name: 'id',
    description: '文章的唯一标识符',
  })
  async updateArticle(
    @Param('id', ParseIntPipe) id: number, // 确保 id 是数字类型
    @Body() articleData: UpdateArticleDto,
  ): Promise<Article> {
    return this.articleService.update(id, articleData);
  }

  @Post() // 使用 POST 方法表示创建操作
  @ApiOperation({ summary: '创建文章' })
  @ApiBody({
    description: '文章的详细数据，包括标题、内容、封面等',
    type: CreateArticleDto, // 确保使用创建文章的 DTO
  })
  async createArticle(@Body() articleData: CreateArticleDto): Promise<Article> {
    return this.articleService.create(articleData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  async deleteArticle(@Param('id') id: number) {
    return this.articleService.delete(id);
  }
}
