import { Test, TestingModule } from '@nestjs/testing';
import { DailyQuoteController } from './daily-quote.controller';

describe('DailyQuoteController', () => {
  let controller: DailyQuoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyQuoteController],
    }).compile();

    controller = module.get<DailyQuoteController>(DailyQuoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
