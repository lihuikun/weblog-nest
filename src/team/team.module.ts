import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../category/entities/category.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../user/entities/user.entity';
import { TeamController } from './team.controller';
import { TeamInvite } from './entities/team-invite.entity';
import { TeamService } from './team.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamInvite, User, Category, Order])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule { }
