import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDreamDto {
  @ApiProperty({ description: '梦境内容' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: '梦境标题', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: '梦境情绪', required: false })
  @IsOptional()
  @IsString()
  emotion?: string;

  @ApiProperty({ description: '梦境标签', required: false, type: [String] })
  @IsOptional()
  tags?: any;
}
