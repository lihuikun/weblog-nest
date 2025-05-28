import { Test, TestingModule } from '@nestjs/testing';
import { SparkController } from './spark.controller';
import { SparkService } from './spark.service';

describe('SparkController', () => {
  let controller: SparkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SparkController],
      providers: [SparkService],
    }).compile();

    controller = module.get<SparkController>(SparkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
