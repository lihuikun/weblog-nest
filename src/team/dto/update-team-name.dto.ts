import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateTeamNameDto {
  @ApiProperty({ description: '新的团队名称', example: 'A-Team' })
  @IsString()
  @IsNotEmpty({ message: '团队名称不能为空' })
  @MaxLength(100, { message: '团队名称长度不能超过100个字符' })
  teamName: string;
}
