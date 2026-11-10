import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGameLoginDto {
  @ApiProperty({ description: '微信小游戏登录凭证' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: '游戏昵称', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ description: '用户头像 URL', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
