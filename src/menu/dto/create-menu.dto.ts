import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({ description: '菜单标题（最多20字符）', maxLength: 20 })
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(20, { message: '标题最多20个字符' })
  title: string;

  @ApiProperty({ description: '菜单分类', example: '家常菜' })
  @IsString()
  @IsNotEmpty({ message: '分类不能为空' })
  @MaxLength(100, { message: '分类最多100个字符' })
  category: string;

  @ApiProperty({ description: '是否分享到菜单广场', example: false })
  @IsBoolean()
  shareToSquare: boolean;

  @ApiProperty({ description: '菜单描述' })
  @IsString()
  @IsNotEmpty({ message: '描述不能为空' })
  description: string;

  @ApiProperty({
    description: '菜单步骤列表',
    required: false,
    example: ['准备食材', '热锅下油', '翻炒出香味'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @ApiProperty({
    description: '食材列表',
    required: false,
    example: ['排骨', '酱油', '盐'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

  @ApiProperty({ description: '封面图片地址' })
  @IsString()
  @IsNotEmpty({ message: '封面不能为空' })
  @MaxLength(255, { message: '封面地址过长' })
  cover: string;

  @ApiProperty({ description: '价格', example: 19.9 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '价格格式不正确' })
  @Min(0, { message: '价格不能小于0' })
  price: number;

  @ApiProperty({ description: '推荐数（1到5星）', minimum: 1, maximum: 5, example: 4 })
  @IsNumber({}, { message: '推荐数必须是数字' })
  @Min(1, { message: '推荐数最小为1' })
  @Max(5, { message: '推荐数最大为5' })
  recommendation: number;

  @ApiProperty({ description: '时长（非必填）', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '时长最多50个字符' })
  duration?: string;

  @ApiProperty({ description: '难度（非必填）', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '难度最多50个字符' })
  difficulty?: string;
}
