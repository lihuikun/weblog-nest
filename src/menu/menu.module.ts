import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamModule } from '../team/team.module';
import { UserModule } from '../user/user.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { Menu } from './entities/menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu]), TeamModule, UserModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule { }
