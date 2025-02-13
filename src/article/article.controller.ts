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
import { ArticleService } from './article.service';
import { Article } from './entities/article.entity';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: '获取文章列表' })
  async getArticles(
    @Query('pageIndex') pageIndex: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.articleService.getArticles(pageIndex, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单篇文章' })
  async getArticleById(@Param('id') id: number) {
    return this.articleService.getArticleById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建文章' })
  @ApiBody({
    description: '文章的详细数据，包括标题、内容、分类等',
    type: CreateArticleDto,
  })
  async createArticle(@Body() articleData: Partial<Article>) {
    return this.articleService.createArticle(articleData);
  }

  // 更新文章
  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  @ApiBody({
    description: '文章的详细数据，包括标题、内容、分类等',
    type: UpdateArticleDto,
  })
  async updateArticle(
    @Param('id') id: number,
    @Body() articleData: Partial<Article>,
  ) {
    return this.articleService.updateArticle(id, articleData);
  }

  // 删除文章
  @Delete(':id')
  async deleteArticle(@Param('id') id: number) {
    return this.articleService.deleteArticle(id);
  }
}
