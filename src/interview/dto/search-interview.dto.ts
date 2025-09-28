import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class SearchInterviewDto {
  @ApiProperty({ 
    description: '搜索关键词，支持标题和内容模糊搜索', 
    example: 'JavaScript闭包' 
  })
  @IsNotEmpty()
  @IsString()
  keyword: string;

  @ApiProperty({
    description: '分类ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiProperty({
    description: '难度等级，1-5',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiProperty({
    description: '是否需要会员权限',
    example: false,
    required: false,
  })
  @IsOptional()
  requirePremium?: boolean;
}
