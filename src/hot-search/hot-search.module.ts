import { Module } from '@nestjs/common';
import { HotSearchService } from './hot-search.service';
import { HotSearchController } from './hot-search.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotSearch } from './entities/hot-search.entity';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    TypeOrmModule.forFeature([HotSearch]),
    ScheduleModule.forRoot(), // 定时任务
  ],
  controllers: [HotSearchController],
  providers: [HotSearchService],
})
export class HotSearchModule {}
