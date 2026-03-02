import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('yesterday-user-article')
  @ApiOperation({
    summary: '获取昨日 vs 前日 注册用户对比，以及昨日文章浏览统计',
  })
  async getTodayUserInterviewStats() {
    return this.statsService.getTodayUserInterviewStats();
  }
}

