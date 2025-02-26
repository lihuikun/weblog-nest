import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({
    description: '文章 ID',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  articleId: number;
}
