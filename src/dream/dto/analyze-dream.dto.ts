import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AnalyzeDreamDto {
  @ApiProperty({ description: '梦境分析提示词', required: false })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({ description: '分析偏好', required: false })
  @IsOptional()
  @IsString()
  preference?: string;
}
