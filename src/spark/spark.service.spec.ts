import { Test, TestingModule } from '@nestjs/testing';
import { SparkService } from './spark.service';

describe('SparkService', () => {
  let service: SparkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SparkService],
    }).compile();

    service = module.get<SparkService>(SparkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
