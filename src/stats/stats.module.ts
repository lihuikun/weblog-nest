import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { User } from '../user/entities/user.entity';
import { Article } from '../article/entities/article.entity';
import { Pv } from '../pv/entities/pv.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Article, Pv])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

