import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength } from 'class-validator';

export class CreateSquareCategoryDto {
  @ApiProperty({ description: '分类名称', example: '家常菜' })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: '分类描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '分类图片', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string;

  @ApiProperty({ description: '排序值，越小越靠前', required: false, example: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;
}
