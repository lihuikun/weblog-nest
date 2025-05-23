import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message-read.entity';
import { User } from 'src/user/entities/user.entity';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { RoleGuard } from 'src/common/decorators/require-role.decorator';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageRead, User]),
    UserModule
  ],
  providers: [MessageService, RoleGuard],
  controllers: [MessageController],
})
export class MessageModule { }
