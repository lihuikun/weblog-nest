import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateInterviewDto {
  @ApiProperty({ description: '面试题标题', example: 'JavaScript闭包原理' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: '面试题问题',
    example: '请解释什么是JavaScript中的闭包，以及它的应用场景有哪些？',
  })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({
    description: '面试题答案',
    example: '闭包是指有权访问另一个函数作用域中的变量的函数...',
  })
  @IsNotEmpty()
  @IsString()
  answer: string;

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
  @IsBoolean()
  requirePremium?: boolean;
} 