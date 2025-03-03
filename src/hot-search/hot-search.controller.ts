import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { HotSearchService } from './hot-search.service';
import { CreateHotSearchDto } from './dto/create-hot-search.dto';
import { UpdateHotSearchDto } from './dto/update-hot-search.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('hot-search')
export class HotSearchController {
  constructor(private readonly hotSearchService: HotSearchService) {}

  @Get('fetch')
  @ApiOperation({ summary: '手动触发爬取任务' })
  async fetchManually() {
    await this.hotSearchService.fetchAllHotSearch();
    return { message: '爬取任务已手动触发' };
  }

  /**
   * 获取热搜数据
   * @param source 来源 (douyin, juejin, baidu)
   */
  @Get()
  async getHotSearch(@Query('source') source: string) {
    return this.hotSearchService.getHotSearch(source);
  }
}
