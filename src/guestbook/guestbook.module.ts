import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestbookService } from './guestbook.service';
import { GuestbookController } from './guestbook.controller';
import { Guestbook } from './entities/guestbook.entity';
import { User } from '../user/entities/user.entity';
import { RoleGuard } from '../common/decorators/require-role.decorator';

@Module({
  imports: [TypeOrmModule.forFeature([Guestbook, User])],
  controllers: [GuestbookController],
  providers: [GuestbookService, RoleGuard],
  exports: [GuestbookService],
})
export class GuestbookModule {}

