import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from '../menu/entities/menu.entity';
import { TeamModule } from '../team/team.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Menu]), TeamModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule { }
