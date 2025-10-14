import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsUrl, IsNumber } from 'class-validator';

export class CreateResumeTemplateDto {
  @ApiProperty({ description: '简历模板名称', example: '经典商务简历模板' })
  @IsNotEmpty({ message: '简历模板名称不能为空' })
  @IsString({ message: '简历模板名称必须是字符串' })
  name: string;

  @ApiProperty({ description: '预览图URL', example: 'https://example.com/preview.jpg', required: false })
  @IsOptional()
  @IsUrl({}, { message: '预览图URL格式不正确' })
  previewImageUrl?: string;

  @ApiProperty({ description: '下载链接', example: 'https://example.com/download.zip', required: false })
  @IsOptional()
  @IsUrl({}, { message: '下载链接格式不正确' })
  downloadUrl?: string;

  @ApiProperty({ description: '是否为会员模板', example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: '是否为会员模板必须是布尔值' })
  isPremium?: boolean;

  @ApiProperty({ description: '模板主题颜色', example: '#3B82F6', required: false })
  @IsOptional()
  @IsString({ message: '模板主题颜色必须是字符串' })
  color?: string;

  @ApiProperty({ description: '模板类型', example: 0, default: 0, enum: [0, 1] })
  @IsOptional()
  @IsNumber({}, { message: '模板类型必须是数字' })
  type?: number;
}
