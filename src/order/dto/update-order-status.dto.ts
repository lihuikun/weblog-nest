import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: '订单状态',
    enum: OrderStatus,
    example: OrderStatus.COMPLETED,
  })
  @IsEnum(OrderStatus, { message: 'status必须为有效订单状态' })
  status: OrderStatus;
}
