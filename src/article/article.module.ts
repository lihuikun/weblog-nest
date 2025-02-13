import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { Article } from './entities/article.entity';
import { Favorite } from '../favorite/entities/favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Favorite])],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
