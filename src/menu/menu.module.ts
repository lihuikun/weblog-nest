import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamModule } from '../team/team.module';
import { UserModule } from '../user/user.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [PrismaModule, TeamModule, UserModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
