import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '评论内容', example: '这是一条评论' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: '父评论 ID（可选）',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiProperty({
    description: '文章 ID',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  articleId: number;
}
