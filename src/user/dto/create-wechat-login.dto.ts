import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateWechatLoginDto {
  @ApiProperty({ description: '微信登录凭证' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: '微信公众号登录凭证' })
  @IsNotEmpty()
  @IsString()
  redirectUri?: string;
}
