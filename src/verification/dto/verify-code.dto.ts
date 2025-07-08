import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { VerificationType } from '../entities/verification.entity';

export class VerifyCodeDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ 
    description: '验证码类型', 
    enum: VerificationType,
    example: VerificationType.EMAIL_REGISTRATION
  })
  @IsNotEmpty()
  @IsEnum(VerificationType)
  type: VerificationType;
} 