import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Length,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ description: '文章标题', example: '如何学习 NestJS' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiProperty({
    description: '文章内容',
    example: '这是一个关于 NestJS 的教程...',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: '文章封面图 URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
