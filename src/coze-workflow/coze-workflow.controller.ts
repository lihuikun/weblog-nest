import {
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CozeWorkflowService } from './coze-workflow.service';

@Controller('coze-workflow')
export class CozeWorkflowController {
  constructor(private readonly cozeWorkflowService: CozeWorkflowService) {}

  @Post('execute')
  @ApiOperation({ summary: '手动触发 Coze 工作流执行' })
  async executeManually() {
    try {
      await this.cozeWorkflowService.executeWorkflow();
      return {
        success: true,
        message: 'Coze 工作流执行成功',
      };
    } catch (error) {
      return {
        success: false,
        message: `Coze 工作流执行失败: ${error.message}`,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: '获取数据库的工作流数据' })
  async getLatestData() {
    const data = await this.cozeWorkflowService.getLatestWorkflowData();
    if (!data) {
      return {
        message: '暂无数据',
      };
    }

    return {
      ...data,
      // data 字段已经是格式化后的文本（日期+邮件格式），直接返回
    };
  }
}
