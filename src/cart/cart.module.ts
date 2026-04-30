import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamModule } from '../team/team.module';
import { Menu } from '../menu/entities/menu.entity';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, Menu]), TeamModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule { }
