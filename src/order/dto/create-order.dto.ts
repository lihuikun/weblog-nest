import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ description: '菜单ID', example: 1 })
  @IsInt({ message: 'menuId必须为整数' })
  @Min(1, { message: 'menuId必须大于0' })
  menuId: number;

  @ApiProperty({ description: '数量', example: 2 })
  @IsInt({ message: 'quantity必须为整数' })
  @Min(1, { message: 'quantity最小为1' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: '订单菜品列表',
    type: [CreateOrderItemDto],
  })
  @IsArray({ message: 'items必须是数组' })
  items: CreateOrderItemDto[];
}
