import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinTeamDto {
  @ApiProperty({ description: '团队邀请码', example: 'a1b2c3d4' })
  @IsString()
  @IsNotEmpty({ message: '邀请码不能为空' })
  inviteCode: string;
}
