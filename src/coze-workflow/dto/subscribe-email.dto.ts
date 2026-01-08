import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class SubscribeEmailDto {
  @ApiProperty({
    description: '订阅邮箱',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}
