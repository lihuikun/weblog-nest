import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDreamDto {
  @ApiProperty({ description: '梦境内容', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '梦境标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '梦境情绪', required: false })
  @IsOptional()
  @IsString()
  emotion?: string;

  @ApiProperty({ description: '梦境解析', required: false })
  @IsOptional()
  @IsString()
  interpretation?: string;

  @ApiProperty({ description: '梦境标签', required: false })
  @IsOptional()
  @IsString()
  tags?: string;
}
