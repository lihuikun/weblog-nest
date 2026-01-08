import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiBody } from '@nestjs/swagger';
import { CozeWorkflowService } from './coze-workflow.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../common/decorators/require-role.decorator';
import { SubscribeEmailDto } from './dto/subscribe-email.dto';
import { UpdateEmailPushDto } from './dto/update-email-push.dto';

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

  @Post('subscribe')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '订阅邮箱' })
  @ApiBody({
    description: '订阅邮箱信息',
    type: SubscribeEmailDto,
  })
  async subscribeEmail(
    @CurrentUserId() userId: number,
    @Body() subscribeEmailDto: SubscribeEmailDto,
  ) {
    try {
      return await this.cozeWorkflowService.subscribeEmail(
        userId,
        subscribeEmailDto.email,
      );
    } catch (error) {
      return {
        success: false,
        message: `订阅失败: ${error.message}`,
      };
    }
  }

  @Get('subscription')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '获取当前用户的订阅信息' })
  async getSubscription(@CurrentUserId() userId: number) {
    const subscription = await this.cozeWorkflowService.getUserSubscription(
      userId,
    );
    if (!subscription) {
      return {
        message: '暂无订阅信息',
      };
    }
    return subscription;
  }

  @Post('email-push')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '更新邮件推送开关' })
  @ApiBody({
    description: '邮件推送开关状态',
    type: UpdateEmailPushDto,
  })
  async updateEmailPush(
    @CurrentUserId() userId: number,
    @Body() updateEmailPushDto: UpdateEmailPushDto,
  ) {
    try {
      return await this.cozeWorkflowService.updateEmailPushStatus(
        userId,
        updateEmailPushDto.receiveArticleEmail,
      );
    } catch (error) {
      return {
        success: false,
        message: `更新失败: ${error.message}`,
      };
    }
  }
}
