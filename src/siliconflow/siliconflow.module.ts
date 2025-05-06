import { Module } from '@nestjs/common';
import { SiliconFlowService } from './siliconflow.service';
import { SiliconflowController } from './siliconflow.controller';

@Module({
  controllers: [SiliconflowController],
  providers: [SiliconFlowService],
})
export class SiliconflowModule { }
