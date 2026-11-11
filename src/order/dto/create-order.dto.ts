import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, Min, ValidateIf } from 'class-validator';

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

  @ApiProperty({ description: '是否在订单创建后发送邮件通知', required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'sendEmail必须是布尔值' })
  sendEmail?: boolean;

  @ApiProperty({ description: '邮件接收地址，sendEmail为true时必填', required: false, example: 'example@qq.com' })
  @ValidateIf((dto) => dto.sendEmail === true)
  @IsNotEmpty({ message: '开启邮件通知时必须填写邮箱' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  recipientEmail?: string;
}
