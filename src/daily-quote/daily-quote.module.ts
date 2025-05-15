import { Module } from '@nestjs/common';
import { DailyQuoteService } from './daily-quote.service';
import { DailyQuoteController } from './daily-quote.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyQuote } from './entities/daily-quote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyQuote])],
  providers: [DailyQuoteService],
  controllers: [DailyQuoteController]
})
export class DailyQuoteModule { }
