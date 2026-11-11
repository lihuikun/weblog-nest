import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
export class CreateUserDto {
  @ApiProperty({ description: '用户昵称', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '用户头像 URL', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ description: '投喂通知邮箱', required: false, example: 'example@qq.com' })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的通知邮箱' })
  notificationEmail?: string;
}
