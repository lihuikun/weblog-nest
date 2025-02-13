import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  // 获取文章列表
  async getArticles(pageIndex: number = 1, pageSize: number = 10) {
    const [articles, total] = await this.articleRepository.findAndCount({
      skip: (pageIndex - 1) * pageSize,
      take: pageSize,
      order: {
        publish_date: 'DESC',
      },
    });

    const totalPage = Math.ceil(total / pageSize);
    const hasMore = pageIndex < totalPage;

    return { hasMore, data: articles };
  }

  // 根据ID获取单篇文章
  async getArticleById(id: number) {
    return await this.articleRepository.findOne({
      where: {
        id,
      },
    });
  }

  // 创建文章
  async createArticle(articleData: Partial<Article>) {
    const article = this.articleRepository.create(articleData);
    return await this.articleRepository.save(article);
  }

  // 更新文章
  async updateArticle(id: number, articleData: Partial<Article>) {
    await this.articleRepository.update(id, articleData);
    return await this.articleRepository.findOne({
      where: {
        id,
      },
    });
  }

  // 删除文章
  async deleteArticle(id: number) {
    const result = await this.articleRepository.delete(id);
    return result.affected > 0;
  }
}
