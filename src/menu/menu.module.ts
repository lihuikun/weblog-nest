import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamModule } from '../team/team.module';
import { UserModule } from '../user/user.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { Menu } from './entities/menu.entity';
import { Category } from '../category/entities/category.entity';
import { SquareCategory } from '../square-category/entities/square-category.entity';
import { User } from '../user/entities/user.entity';
import { RoleGuard } from '../common/decorators/require-role.decorator';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, Category, SquareCategory, User]), TeamModule, UserModule],
  controllers: [MenuController],
  providers: [MenuService, RoleGuard],
})
export class MenuModule { }
