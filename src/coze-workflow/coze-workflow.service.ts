import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import * as cron from 'node-cron';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { CozeWorkflow } from './entities/coze-workflow.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CozeWorkflowService {
  private readonly logger = new Logger(CozeWorkflowService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(CozeWorkflow)
    private readonly cozeWorkflowRepository: Repository<CozeWorkflow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
     * 每天早上9点执行一次
     */
    cron.schedule(
      '0 9 * * *',
      async () => {
        await this.executeWorkflow();
      },
      {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      },
    );
    this.logger.log('Coze 工作流定时任务已开启：每天 09:00 (Asia/Shanghai)');
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

      // 获取logo路径
      const logoPath = path.join(__dirname, '..', '..', 'src', 'assets', 'logo.jpg');

      // 获取所有开启邮件推送的用户
      const users = await this.userRepository.find({
        where: { receiveArticleEmail: true },
      });

      // 收集所有订阅的邮箱（使用 BCC 密送，不暴露其他用户邮箱）
      const bccList: string[] = [];
      users.forEach((user) => {
        // 直接使用用户的 email 字段
        if (user.email && user.email !== recipientEmail) {
          bccList.push(user.email);
        }
      });

      await this.transporter.sendMail({
        from: `"前端的日常" <${sender}>`,
        to: recipientEmail, // 默认收件人
        bcc: bccList.length > 0 ? bccList.join(',') : undefined, // 密送所有订阅用户
        subject: `📚 前端技术文章推荐 - ${dateLabel}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @media only screen and (max-width: 600px) {
                .email-container {
                  width: 100% !important;
                  padding: 20px 0 !important;
                }
                .email-content {
                  width: 100% !important;
                  border-radius: 0 !important;
                }
                .header-section {
                  padding: 25px 20px !important;
                }
                .logo-img {
                  max-width: 50px !important;
                  margin-bottom: 10px !important;
                }
                .header-title {
                  font-size: 22px !important;
                  letter-spacing: 1px !important;
                }
                .header-subtitle {
                  font-size: 13px !important;
                }
                .date-section {
                  padding: 20px 15px 15px 15px !important;
                }
                .date-text {
                  font-size: 14px !important;
                }
                .content-section {
                  padding: 20px 15px !important;
                }
                .article-card {
                  padding: 15px !important;
                  margin-bottom: 15px !important;
                }
                .article-number {
                  min-width: 26px !important;
                  height: 26px !important;
                  font-size: 12px !important;
                  margin-right: 12px !important;
                }
                .article-title {
                  font-size: 15px !important;
                  margin-bottom: 10px !important;
                }
                .article-link {
                  font-size: 12px !important;
                  padding: 6px 10px !important;
                  display: block !important;
                  word-break: break-all !important;
                }
                .prompt-section {
                  padding: 20px 15px !important;
                }
                .prompt-box {
                  padding: 20px 15px !important;
                }
                .prompt-title {
                  font-size: 18px !important;
                }
                .prompt-text {
                  font-size: 14px !important;
                }
                .footer-section {
                  padding: 20px 15px !important;
                }
                .footer-text {
                  font-size: 11px !important;
                }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 0;" class="email-container">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;" class="email-content">
                    <!-- 头部品牌区域 -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%); padding: 40px 30px; text-align: center;" class="header-section">
                        <img src="cid:logo" alt="前端的日常" style="max-width: 50px; height: auto; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); display: block; margin-left: auto; margin-right: auto;" class="logo-img" />
                        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);" class="header-title">
                          前端的日常
                        </h1>
                        <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 300;" class="header-subtitle">
                          每日精选前端技术文章
                        </p>
                      </td>
                    </tr>
                    
                    <!-- 日期信息 -->
                    <tr>
                      <td style="padding: 25px 30px 20px 30px; border-bottom: 2px solid #f0f0f0;" class="date-section">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                          <span style="color: #1890ff; font-size: 15px; font-weight: 600;" class="date-text">
                            📅 ${dateLabel}
                          </span>
                          <span style="color: #999; font-size: 13px;">
                            共 ${workflowData?.articles?.length || 0} 篇文章
                          </span>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- 文章列表 -->
                    <tr>
                      <td style="padding: 30px;" class="content-section">
                        ${articlesHtml}
                      </td>
                    </tr>
                    
                    <!-- 微信小程序提示区域 -->
                    <tr>
                      <td style="padding: 30px; background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%); border-top: 3px solid #1890ff;" class="prompt-section">
                        <div style="text-align: center; padding: 25px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);" class="prompt-box">
                          <div style="font-size: 24px; margin-bottom: 15px;">💡</div>
                          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 20px; font-weight: 600;" class="prompt-title">
                            想要提升前端技能？
                          </h3>
                          <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.6;" class="prompt-text">
                            欢迎前往 <strong style="color: #1890ff;">微信小程序「前端的日常」</strong> 进行刷题练习
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- 底部信息 -->
                    <tr>
                      <td style="padding: 25px 30px; background-color: #fafafa; text-align: center; border-top: 1px solid #eee;" class="footer-section">
                        <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;" class="footer-text">
                          此邮件由「前端的日常」系统自动发送<br/>
                          每日 08:00 准时推送，助您掌握最新前端技术动态
                        </p>
                        <p style="margin: 15px 0 0 0; color: #ccc; font-size: 11px;">
                          © 前端的日常 | 专注前端技术分享
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: 'logo.jpg',
            path: logoPath,
            cid: 'logo', // 在HTML中通过 cid:logo 引用
          },
        ],
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
      return `
        <div style="text-align: center; padding: 40px; color: #999;">
          <p style="margin: 0; font-size: 15px;">暂无文章数据</p>
        </div>
      `;
    }

    const articlesHtml = workflowData.articles
      .map((article: any, index: number) => {
        const title = article.title || '无标题';
        const url = article.url || '#';
        return `
          <div style="margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border-left: 4px solid #1890ff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05); transition: all 0.3s ease;" class="article-card">
            <div style="display: flex; align-items: flex-start;">
              <div style="min-width: 30px; height: 30px; background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 600; font-size: 14px; margin-right: 15px; flex-shrink: 0;" class="article-number">
                ${index + 1}
              </div>
              <div style="flex: 1; min-width: 0;">
                <h3 style="margin: 0 0 12px 0; color: #333; font-size: 17px; font-weight: 600; line-height: 1.4; word-wrap: break-word;" class="article-title">
                  ${title}
                </h3>
                <a href="${url}" target="_blank" style="display: inline-block; color: #1890ff; text-decoration: none; font-size: 14px; word-break: break-all; padding: 8px 12px; background-color: #e6f7ff; border-radius: 6px; transition: all 0.3s ease;" class="article-link">
                  🔗 ${url}
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    return articlesHtml;
  }

  /**
   * 获取最新的工作流数据
   */
  async getLatestWorkflowData(): Promise<any> {
    const workflows = await this.cozeWorkflowRepository.find({
      order: { createTime: 'DESC' },
      take: 1,
    });

    if (!workflows || workflows.length === 0) {
      return null;
    }

    const workflow = workflows[0];

    // 返回 JSON 格式的数据
    return {
      id: workflow.id,
      data: workflow.data,
      query: workflow.query,
      count: workflow.count,
      timeRange: workflow.timeRange,
      recipientEmail: workflow.recipientEmail,
      createTime: workflow.createTime,
      updatedTime: workflow.updatedTime,
    };
  }

  /**
   * 订阅邮箱
   * 更新用户的 email 字段（不自动开启推送开关）
   */
  async subscribeEmail(userId: number, email: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 更新用户的邮箱（不自动开启推送开关）
    user.email = email;
    user.updatedTime = new Date();

    await this.userRepository.save(user);

    this.logger.log(`用户 ${userId} 更新邮箱：${email}`);

    return {
      success: true,
      message: '邮箱更新成功，请手动开启推送开关',
      email,
      receiveArticleEmail: user.receiveArticleEmail,
    };
  }

  /**
   * 更新邮件推送开关
   */
  async updateEmailPushStatus(userId: number, receiveArticleEmail: boolean): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    user.receiveArticleEmail = receiveArticleEmail;
    user.updatedTime = new Date();

    await this.userRepository.save(user);

    this.logger.log(`用户 ${userId} ${receiveArticleEmail ? '开启' : '关闭'}邮件推送`);

    return {
      success: true,
      message: receiveArticleEmail ? '已开启邮件推送' : '已关闭邮件推送',
      receiveArticleEmail,
    };
  }

  /**
   * 获取用户的订阅信息
   */
  async getUserSubscription(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      receiveArticleEmail: user.receiveArticleEmail,
    };
  }
}
