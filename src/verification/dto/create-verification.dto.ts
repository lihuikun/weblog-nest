import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { VerificationType } from '../entities/verification.entity';

export class CreateVerificationDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: '验证码类型', 
    enum: VerificationType,
    example: VerificationType.EMAIL_REGISTRATION
  })
  @IsNotEmpty()
  @IsEnum(VerificationType)
  type: VerificationType;
} 