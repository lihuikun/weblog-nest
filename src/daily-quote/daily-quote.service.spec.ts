import { Test, TestingModule } from '@nestjs/testing';
import { DailyQuoteService } from './daily-quote.service';

describe('DailyQuoteService', () => {
  let service: DailyQuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyQuoteService],
    }).compile();

    service = module.get<DailyQuoteService>(DailyQuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
