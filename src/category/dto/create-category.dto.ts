import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称', example: '美食' })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ description: '分类描述', example: '这是一个美食分类' })
  @IsNotEmpty({ message: '分类描述不能为空' })
  @IsString()
  description: string;

  @ApiProperty({
    description: '分类图片 URL',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: '分类状态', example: 'active', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
