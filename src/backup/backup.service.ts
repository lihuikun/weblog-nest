import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as cron from 'node-cron';
import mysqldump from 'mysqldump';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
    this.scheduleDailyBackup();
  }

  private createTransporter(): nodemailer.Transporter {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    if (!user || !pass) {
      this.logger.warn('未配置邮箱凭证，数据库备份邮件将无法发送');
    }

    return nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user,
        pass,
      },
    });
  }

  private scheduleDailyBackup(): void {
    cron.schedule(
      '0 0 * * *',
      async () => {
        await this.handleBackupTask();
      },
      {
        timezone: 'Asia/Shanghai',
      },
    );
    this.logger.log('数据库每日备份任务已开启：00:00 (Asia/Shanghai)');
  }

  /**
   * 手动触发备份（用于接口调用）
   */
  async runBackupNow(): Promise<{ success: boolean; message: string }> {
    try {
      await this.handleBackupTask();
      return { success: true, message: '数据库备份已完成（手动触发）' };
    } catch (error) {
      return {
        success: false,
        message: `数据库备份失败: ${error.message}`,
      };
    }
  }

  private async handleBackupTask(): Promise<void> {
    const startedAt = Date.now();
    try {
      const backupFilePath = await this.createDatabaseBackup();
      await this.sendBackupEmail(backupFilePath);
      await this.deleteBackupFile(backupFilePath);
      this.logger.log(`数据库备份任务完成，耗时 ${Date.now() - startedAt}ms`);
    } catch (error) {
      this.logger.error(`数据库备份任务失败: ${error.message}`, error.stack);
    }
  }

  private async createDatabaseBackup(): Promise<string> {
    const host = this.configService.get<string>('DATABASE_HOST');
    const port = this.configService.get<string>('DATABASE_PORT');
    const username = this.configService.get<string>('DATABASE_USERNAME');
    const password = this.configService.get<string>('DATABASE_PASSWORD');
    const database = this.configService.get<string>('DATABASE_NAME');

    if (!host || !port || !username || !database) {
      throw new Error('数据库配置不完整，无法执行备份');
    }

    const backupDir = path.resolve(process.cwd(), 'backups');
    await fs.promises.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `db-backup-${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    await this.runMysqlDump({
      host,
      port,
      username,
      password,
      database,
      targetPath: backupFilePath,
    });

    return backupFilePath;
  }

  private async runMysqlDump(options: {
    host: string;
    port: string;
    username: string;
    password?: string;
    database: string;
    targetPath: string;
  }): Promise<void> {
    // 使用纯 JS 的 mysqldump 库，避免依赖本地 mysqldump 可执行文件
    await mysqldump({
      connection: {
        host: options.host,
        port: Number(options.port),
        user: options.username,
        password: options.password,
        database: options.database,
      },
      dumpToFile: options.targetPath,
      compressFile: false,
    });
  }

  private async sendBackupEmail(filePath: string): Promise<void> {
    const recipient =
      this.configService.get<string>('BACKUP_EMAIL') ||
      'lihk180542@gmail.com';
    const sender = this.configService.get<string>('EMAIL_USER');

    if (!sender) {
      throw new Error('未配置 EMAIL_USER，无法发送备份邮件');
    }

    const fileName = path.basename(filePath);
    const dateLabel = new Date().toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });

    await this.transporter.sendMail({
      from: `"前端的日常" <${sender}>`,
      to: recipient,
      subject: `每日数据库备份 - ${dateLabel}`,
      html: `
        <p>数据库备份已完成，详见附件。</p>
        <p>文件名：${fileName}</p>
        <p>执行时间：${dateLabel} 00:00 (Asia/Shanghai)</p>
        <p>如无需保留本地文件，已自动清理。</p>
      `,
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    });
  }

  private async deleteBackupFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      this.logger.warn(`备份文件删除失败: ${error.message}`);
    }
  }
}

