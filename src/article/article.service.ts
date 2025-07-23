import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private dataSource: DataSource,
  ) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const article = this.articleRepository.create(createArticleDto);
    return await this.articleRepository.save(article);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    categoryId?: number,
  ): Promise<{ total: number; rows: Article[] }> {
    const skip = (page - 1) * pageSize;
    // 原先的查询方式
    // const queryBuilder = this.dataSource
    //   .createQueryBuilder()
    //   .select('article')
    //   .from(Article, 'article')
    //   .leftJoinAndSelect('article.comments', 'comment')
    //   .leftJoinAndSelect('comment.replies', 'reply')
    //   .leftJoinAndSelect('article.likes', 'like')
    //   .leftJoinAndSelect('article.favorites', 'favorite')
    //   .where(
    //     new Brackets((qb) => {
    //       qb.where('comment.parentComment IS NULL'); // 只加载顶级评论
    //     }),
    //   )
    //   .skip(skip)
    //   .take(pageSize);

    // 获取分类下的文章
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .orderBy('article.createTime', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (Number(categoryId) !== 0) {
      queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    const articles = await queryBuilder.getMany();
    const total = await queryBuilder.getCount();

    return { total, rows: articles };
  }

  async findOne(
    articleId: number,
    page: number = 1,
    pageSize: number = 1,
  ): Promise<any> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select([
        'article.id',
        'article.title',
        'like.id AS likeId',
        'favorite.id AS favoriteId',
        'comment.id AS commentId',
        'comment.content AS commentContent',
        'reply.id AS replyId',
        'reply.content AS replyContent',
      ])
      .from(Article, 'article')
      .leftJoinAndSelect('article.comments', 'comment')
      .leftJoinAndSelect('comment.replies', 'reply')
      .leftJoinAndSelect('article.likes', 'like')
      .leftJoinAndSelect('article.favorites', 'favorite')
      .where('article.id = :articleId', { articleId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('comment.parentComment IS NULL'); // 只加载顶级评论
        }),
      )
      .skip((page - 1) * pageSize) // 分页起始位置
      .take(pageSize); // 每页数量限制

    const article = await queryBuilder.getOne();
    console.log('🚀 ~ ArticleService ~ article:', article);
    if (!article) {
      return null; // 处理没有找到文章的情况
    }

    // 将查询结果按需求进行格式化
    const res = {
      id: article.id,
      title: article.title, // 假设返回文章标题
      comments: article.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
        })),
      })),
    };

    return res as any;
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    await this.articleRepository.update(id, updateArticleDto);
    const updatedArticle = await this.articleRepository.findOne({
      where: { id },
      relations: ['comments'],
    });
    if (!updatedArticle) {
      throw new Error(`Article with ID ${id} not found`);
    }
    return updatedArticle;
  }

  async delete(id: number): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Article with ID ${id} not found`);
    }
  }
}
