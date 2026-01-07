import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import * as nodemailer from 'nodemailer';
import { CozeWorkflow } from './entities/coze-workflow.entity';

@Injectable()
export class CozeWorkflowService {
  private readonly logger = new Logger(CozeWorkflowService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(CozeWorkflow)
    private readonly cozeWorkflowRepository: Repository<CozeWorkflow>,
    private readonly configService: ConfigService,
  ) {
    // 初始化邮件发送器
    this.transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    /**
     * 每天早上8点执行一次
     */
    cron.schedule(
      '0 8 * * *',
      async () => {
        await this.executeWorkflow();
      },
      {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      },
    );
    this.logger.log('Coze 工作流定时任务已开启：每天 08:00 (Asia/Shanghai)');
  }

  /**
   * 执行 Coze 工作流
   */
  async executeWorkflow(): Promise<void> {
    try {
      const apiToken = this.configService.get<string>('COZE_API_TOKEN');
      if (!apiToken) {
        throw new Error('未配置 COZE_API_TOKEN');
      }

      const query =
        this.configService.get<string>('COZE_QUERY') ||
        '前端架构 React Vue TypeScript 工程化';
      const count = parseInt(
        this.configService.get<string>('COZE_COUNT') || '10',
        10,
      );
      const timeRange =
        this.configService.get<string>('COZE_TIME_RANGE') || 'OneWeek';
      const recipientEmail =
        this.configService.get<string>('COZE_RECIPIENT_EMAIL') ||
        'lihk180542@gmail.com';

      const response = await axios.post(
        'https://6d6cwzyrkt.coze.site/run',
        {
          query,
          count: count.toString(),
          time_range: timeRange,
          recipient_email: recipientEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // 格式化文章数据（只保留 title + url）
      const formattedData = this.formatArticlesData(response.data);

      // 保存数据到数据库（覆盖旧数据）
      await this.saveWorkflowData({
        data: formattedData,
        query,
        count,
        timeRange,
        recipientEmail,
      });

      // 发送邮件通知
      await this.sendNotificationEmail(recipientEmail, response.data);

      this.logger.log('Coze 工作流执行成功');
    } catch (error) {
      this.logger.error(`Coze 工作流执行失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 格式化文章数据（只保留日期 + title + 链接）
   */
  private formatArticlesData(workflowData: any): string {
    const dateLabel = new Date().toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });

    if (!workflowData?.articles || !Array.isArray(workflowData.articles)) {
      return `${dateLabel}\n暂无文章数据`;
    }

    const articlesList = workflowData.articles
      .map((article: any, index: number) => {
        const title = article.title || '无标题';
        const url = article.url || '#';
        return `${index + 1}. ${title}\n   ${url}`;
      })
      .join('\n\n');

    return `${dateLabel}\n\n${articlesList}`;
  }

  /**
   * 保存工作流数据（覆盖旧数据）
   */
  private async saveWorkflowData(data: {
    data: string;
    query: string;
    count: number;
    timeRange: string;
    recipientEmail: string;
  }): Promise<void> {
    // 删除所有旧数据
    await this.cozeWorkflowRepository.delete({});

    // 插入新数据
    const workflow = this.cozeWorkflowRepository.create({
      data: data.data,
      query: data.query,
      count: data.count,
      timeRange: data.timeRange,
      recipientEmail: data.recipientEmail,
    });

    await this.cozeWorkflowRepository.save(workflow);
    this.logger.log('工作流数据已保存（覆盖旧数据）');
  }

  /**
   * 发送通知邮件
   */
  private async sendNotificationEmail(
    recipientEmail: string,
    workflowData: any,
  ): Promise<void> {
    try {
      const sender = this.configService.get<string>('EMAIL_USER');
      if (!sender) {
        this.logger.warn('未配置 EMAIL_USER，无法发送通知邮件');
        return;
      }

      const dateLabel = new Date().toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
      });

      // 格式化邮件内容（只显示 title + 链接）
      const articlesHtml = this.formatArticlesForEmail(workflowData);

      await this.transporter.sendMail({
        from: `"前端的日常" <${sender}>`,
        to: recipientEmail,
        subject: `前端技术文章推荐 - ${dateLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">前端技术文章推荐</h2>
            <p style="color: #666; margin-bottom: 20px;">日期：${dateLabel}</p>
            <div style="margin-top: 20px;">
              ${articlesHtml}
            </div>
            <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
              此邮件由系统自动发送，请勿回复。
            </p>
          </div>
        `,
      });

      this.logger.log(`通知邮件已发送至 ${recipientEmail}`);
    } catch (error) {
      this.logger.error(`发送通知邮件失败: ${error.message}`);
    }
  }

  /**
   * 格式化文章列表为邮件 HTML（只显示 title + 链接）
   */
  private formatArticlesForEmail(workflowData: any): string {
    if (!workflowData?.articles || !Array.isArray(workflowData.articles)) {
      return '<p>暂无文章数据</p>';
    }

    const articlesHtml = workflowData.articles
      .map((article: any, index: number) => {
        const title = article.title || '无标题';
        const url = article.url || '#';
        return `
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
              ${index + 1}. ${title}
            </h3>
            <a href="${url}" target="_blank" style="color: #4CAF50; text-decoration: none; font-size: 14px; word-break: break-all;">
              ${url}
            </a>
          </div>
        `;
      })
      .join('');

    return articlesHtml;
  }

  /**
   * 获取最新的工作流数据
   */
  async getLatestWorkflowData(): Promise<CozeWorkflow | null> {
    const workflow = await this.cozeWorkflowRepository.findOne({
      order: { createTime: 'DESC' },
    });

    if (!workflow) {
      return null;
    }

    return workflow;
  }
}
