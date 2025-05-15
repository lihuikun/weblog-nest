import { Controller, Get } from '@nestjs/common';
import { DailyQuoteService } from './daily-quote.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('daily-quote')
export class DailyQuoteController {
    constructor(private readonly dailyQuoteService: DailyQuoteService) { }

    @Get()
    @ApiOperation({ summary: '获取每日名言' })
    @ApiResponse({ status: 200, description: '获取每日名言成功' })
    getDailySentence() {
        return this.dailyQuoteService.getDailySentence();
    }
}
