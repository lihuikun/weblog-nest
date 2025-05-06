import { Test, TestingModule } from '@nestjs/testing';
import { SiliconflowController } from './siliconflow.controller';
import { SiliconFlowService } from './siliconflow.service';

describe('SiliconflowController', () => {
  let controller: SiliconflowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiliconflowController],
      providers: [SiliconFlowService],
    }).compile();

    controller = module.get<SiliconflowController>(SiliconflowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
