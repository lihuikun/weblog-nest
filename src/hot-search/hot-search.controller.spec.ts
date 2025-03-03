import { Test, TestingModule } from '@nestjs/testing';
import { HotSearchController } from './hot-search.controller';
import { HotSearchService } from './hot-search.service';

describe('HotSearchController', () => {
  let controller: HotSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotSearchController],
      providers: [HotSearchService],
    }).compile();

    controller = module.get<HotSearchController>(HotSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
