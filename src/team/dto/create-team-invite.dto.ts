import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateTeamInviteDto {
  @ApiProperty({ description: '邀请码有效天数（默认7天）', required: false, example: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expireDays?: number;
}
