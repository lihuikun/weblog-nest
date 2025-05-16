import { Test, TestingModule } from '@nestjs/testing';
import { JuejinController } from './juejin.controller';

describe('JuejinController', () => {
  let controller: JuejinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JuejinController],
    }).compile();

    controller = module.get<JuejinController>(JuejinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
