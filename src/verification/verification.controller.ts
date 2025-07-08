import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@ApiTags('验证码')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('send')
  @ApiOperation({ summary: '发送验证码' })
  async sendCode(@Body() createVerificationDto: CreateVerificationDto) {
    return this.verificationService.createAndSendCode(createVerificationDto);
  }

  @Post('verify')
  @ApiOperation({ summary: '验证验证码' })
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    const verified = await this.verificationService.verifyCode(verifyCodeDto);
    return { success: verified };
  }
} 