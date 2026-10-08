import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleGuard } from '../common/decorators/require-role.decorator';
import { User } from '../user/entities/user.entity';
import { SquareCategory } from './entities/square-category.entity';
import { SquareCategoryController } from './square-category.controller';
import { SquareCategoryService } from './square-category.service';

@Module({
  imports: [TypeOrmModule.forFeature([SquareCategory, User])],
  controllers: [SquareCategoryController],
  providers: [SquareCategoryService, RoleGuard],
  exports: [SquareCategoryService],
})
export class SquareCategoryModule {}
