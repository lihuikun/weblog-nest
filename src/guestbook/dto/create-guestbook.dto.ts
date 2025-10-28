import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreateGuestbookDto {
  @ApiProperty({ description: '留言内容', example: '这是一个很好的网站，非常喜欢！' })
  @IsNotEmpty({ message: '留言内容不能为空' })
  @IsString({ message: '留言内容必须是字符串' })
  @MaxLength(500, { message: '留言内容不能超过500字' })
  content: string;

  @ApiProperty({ description: '昵称', example: '访客001', required: false })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  nickname?: string;

  @ApiProperty({ description: '头像URL', example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsUrl({}, { message: '头像URL格式不正确' })
  avatarUrl?: string;
}

