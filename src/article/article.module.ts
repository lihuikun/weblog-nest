import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { Article } from './entities/article.entity';
import { Favorite } from '../favorite/entities/favorite.entity';
import { Like } from 'src/like/entities/like.entity';
import { Comment } from '../comment/entities/comment.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Article, Comment, Like, Favorite])],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
