import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateWechatLoginDto {
  @ApiProperty({ description: '微信登录凭证' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ 
    description: '用户昵称', 
    example: '微信用户',
    required: false 
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ 
    description: '用户头像URL', 
    example: 'https://example.com/avatar.jpg',
    required: false 
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ 
    description: '微信公众号登录重定向URI',
    required: false 
  })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}
