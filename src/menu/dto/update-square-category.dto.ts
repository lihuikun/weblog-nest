import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateMenuSquareCategoryDto {
  @ApiProperty({ description: '广场分类ID', example: 1 })
  @IsNotEmpty({ message: '广场分类ID不能为空' })
  @IsInt()
  squareCategoryId: number;
}
