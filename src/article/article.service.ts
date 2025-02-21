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

  async findAll(page: number = 1, pageSize: number = 10): Promise<Article[]> {
    const skip = (page - 1) * pageSize;
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('article')
      .from(Article, 'article')
      .leftJoinAndSelect('article.comments', 'comment')
      .leftJoinAndSelect('comment.replies', 'reply')
      .leftJoinAndSelect('article.likes', 'like')
      .leftJoinAndSelect('article.favorites', 'favorite')
      .where(
        new Brackets((qb) => {
          qb.where('comment.parentComment IS NULL'); // 只加载顶级评论
        }),
      )
      .skip(skip)
      .take(pageSize);

    const articles = await queryBuilder.getMany();
    return articles;
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['comments', 'likes', 'favorites'],
    });
    if (!article) {
      throw new Error(`Article with ID ${id} not found`);
    }
    return article;
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    await this.articleRepository.update(id, updateArticleDto);
    const updatedArticle = await this.articleRepository.findOne({
      where: { id },
      relations: ['comments', 'likes', 'favorites'],
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
