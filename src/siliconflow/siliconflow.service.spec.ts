import { Test, TestingModule } from '@nestjs/testing';
import { SiliconflowService } from './siliconflow.service';

describe('SiliconflowService', () => {
  let service: SiliconflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiliconflowService],
    }).compile();

    service = module.get<SiliconflowService>(SiliconflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
