import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Repository,
} from 'typeorm';
import * as cron from 'node-cron';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
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
     * 每天早上8点执行一次（统计昨天08:00~今天08:00）
     */
    cron.schedule(
      '0 8 * * *',
      async () => {
        try {
          await this.getTodayUserInterviewStats();
        } catch (error) {
          this.logger.error(`每日统计任务失败: ${error.message}`);
        }
      },
      {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      },
    );
  }

  /**
   * 获取昨日（昨天08:00~今天08:00）注册用户统计
   */
  async getTodayUserInterviewStats(): Promise<any> {
    // 无论当前时间几点，都固定统计「昨天 08:00 ～ 今天 08:00」
    const yesterdayEnd = new Date();
    yesterdayEnd.setHours(23, 0, 0, 0); // 今天 08:00

    const yesterdayStart = new Date(yesterdayEnd);
    yesterdayStart.setDate(yesterdayEnd.getDate() - 1); // 昨天 08:00

    // 昨日注册用户（昨天08:00~今天08:00）
    const yesterdayUsers = await this.userRepository.find({
      where: {
        createTime: Between(yesterdayStart, yesterdayEnd),
      },
      select: ['id', 'nickname', 'email', 'createTime'],
      order: { createTime: 'ASC' },
    });
    const summary = {
      date: yesterdayStart.toISOString(),
      yesterdayUserCount: yesterdayUsers.length,
      yesterdayUsers,
    };
    if (yesterdayUsers.length > 0) {
      await this.sendDailyUserStatsEmail(summary);
      this.logger.log(
        `每日统计任务完成并发送邮件：昨日08:00~今日08:00 新增用户 ${summary.yesterdayUserCount} 人`,
      );
    } else {
      this.logger.log('每日统计任务完成：昨日无新注册用户，不发送邮件');
    }
    return summary;
  }

  /**
   * 发送每日新注册用户统计邮件
   */
  private async sendDailyUserStatsEmail(summary: {
    date: string;
    yesterdayUserCount: number;
    yesterdayUsers: Array<Pick<User, 'id' | 'nickname' | 'email' | 'createTime'>>;
  }): Promise<void> {
    const sender = this.configService.get<string>('EMAIL_USER');
    if (!sender) {
      this.logger.warn('未配置 EMAIL_USER，无法发送统计邮件');
      return;
    }

    const recipient =
      this.configService.get<string>('STATS_EMAIL') ||
      this.configService.get<string>('COZE_RECIPIENT_EMAIL') ||
      'lihk180542@gmail.com';

    const dateLabel = new Date(summary.date).toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });

    const userRows =
      summary.yesterdayUsers.length === 0
        ? '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #999;">昨日无新注册用户</td></tr>'
        : summary.yesterdayUsers
            .map((user, index) => {
              const timeStr = user.createTime
                ? new Date(user.createTime).toLocaleString('zh-CN', {
                    timeZone: 'Asia/Shanghai',
                  })
                : '';
              return `
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #666;">${index + 1}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #333;">${user.nickname || ''} (${user.email || ''})</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; color: #999;">${timeStr}</td>
                </tr>
              `;
            })
            .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">
                <tr>
                  <td style="background: linear-gradient(135deg, #1890ff 0%, #0050b3 100%); padding: 30px 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 2px;">
                      前端的日常 · 注册统计
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 300;">
                      时间区间：昨日 08:00 ～ 今日 08:00（${dateLabel}）
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 12px 0; color: #333; font-size: 16px;">
                      昨日新增用户：<strong style="color: #1890ff;">${summary.yesterdayUserCount}</strong> 人
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 16px; font-size: 14px;">
                      <thead>
                        <tr>
                          <th align="left" style="padding: 8px 12px; border-bottom: 2px solid #f0f0f0; color: #999; font-weight: 500;">#</th>
                          <th align="left" style="padding: 8px 12px; border-bottom: 2px solid #f0f0f0; color: #999; font-weight: 500;">账号</th>
                          <th align="left" style="padding: 8px 12px; border-bottom: 2px solid #f0f0f0; color: #999; font-weight: 500;">注册时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${userRows}
                      </tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 24px; background-color: #fafafa; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #999; font-size: 12px; line-height: 1.6;">
                      此邮件由「前端的日常」系统自动发送，用于每日注册数据回顾
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `"前端的日常" <${sender}>`,
      to: recipient,
      subject: `每日注册统计 - ${dateLabel}`,
      html,
    });
  }
}