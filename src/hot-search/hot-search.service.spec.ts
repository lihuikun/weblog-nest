import { Test, TestingModule } from '@nestjs/testing';
import { HotSearchService } from './hot-search.service';

describe('HotSearchService', () => {
  let service: HotSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HotSearchService],
    }).compile();

    service = module.get<HotSearchService>(HotSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
