import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Article } from 'src/article/entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Article])],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
