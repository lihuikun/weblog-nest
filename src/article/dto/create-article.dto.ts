import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: '文章标题',
    type: String,
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '文章内容',
    type: String,
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: '文章分类',
    type: String,
  })
  @IsString()
  category_name: string;

  @ApiProperty({
    description: '文章发布时间，Unix 时间戳格式',
    type: Number,
  })
  @IsInt()
  publish_date: number;

  @ApiProperty({
    description: '文章最后修改时间，Unix 时间戳格式',
    type: Number,
  })
  @IsInt()
  last_modify_date: number;

  @ApiProperty({
    description: '文章状态，0 表示正常，1 表示删除',
    type: Number,
  })
  @IsInt()
  article_status: number;
}
