import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CozeWorkflowService } from './coze-workflow.service';
import { CozeWorkflowController } from './coze-workflow.controller';
import { CozeWorkflow } from './entities/coze-workflow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CozeWorkflow])],
  controllers: [CozeWorkflowController],
  providers: [CozeWorkflowService],
})
export class CozeWorkflowModule {}
