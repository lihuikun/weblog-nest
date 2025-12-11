import {
  Controller,
  Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { BackupService } from './backup.service';

@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('run')
  @ApiOperation({ summary: '手动触发数据库备份并邮件发送' })
  async runBackup() {
    return this.backupService.runBackupNow();
  }
}

