import { Injectable, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Verification, VerificationType } from './entities/verification.entity';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { User } from '../user/entities/user.entity';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Verification)
    private readonly verificationRepository: Repository<Verification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    // 初始化邮件发送器
    this.transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  // 生成6位数字验证码
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 清理过期验证码
  private async cleanExpiredCodes(): Promise<void> {
    try {
      const now = new Date();
      await this.verificationRepository.delete({
        expireTime: LessThan(now),
      });
    } catch (error) {
      this.logger.error(`清理过期验证码失败: ${error.message}`);
    }
  }

  // 发送验证码邮件
  private async sendVerificationEmail(email: string, code: string, type: VerificationType): Promise<boolean> {
    try {
      const subject = type === VerificationType.EMAIL_REGISTRATION
        ? '注册验证码'
        : '重置密码验证码';
      
      // 获取logo路径
      const logoPath = path.join(__dirname, '..', '..', 'src', 'assets', 'logo.jpg');
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="前端的日常" style="max-width: 70px; height: auto;border-radius: 8px;" />
          </div>
          <p>您好，欢迎注册前端的日常</p>
          <p>您的验证码是：</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>该验证码将在10分钟后过期。</p>
          <p>如果您没有请求此验证码，请忽略此邮件。</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
            此邮件由系统自动发送，请勿回复。
          </p>
        </div>
      `;

      await this.transporter.sendMail({
        from: `"前端的日常" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: email,
        subject,
        html,
        attachments: [
          {
            filename: 'logo.jpg',
            path: logoPath,
            cid: 'logo' // 在HTML中通过 cid:logo 引用
          }
        ]
      });

      return true;
    } catch (error) {
      this.logger.error(`发送验证码邮件失败: ${error.message}`);
      return false;
    }
  }

  // 创建并发送验证码
  async createAndSendCode(createVerificationDto: CreateVerificationDto): Promise<{ success: boolean; message: string }> {
    const { email, type } = createVerificationDto;

    // 检查邮箱格式
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: '邮箱格式不正确',
      };
    }

    // 根据验证码类型检查邮箱是否已注册
    if (type === VerificationType.EMAIL_REGISTRATION) {
      // 注册验证码：检查邮箱是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          message: '该邮箱已被注册',
        };
      }
    } 

    // 清理过期验证码
    await this.cleanExpiredCodes();

    // 检查是否有未使用且未过期的验证码
    const now = new Date();
    const existingCode = await this.verificationRepository.findOne({
      where: {
        email,
        type,
        used: false,
        expireTime: MoreThan(now),
      },
    });

    if (existingCode) {
      const diffInMinutes = Math.floor((now.getTime() - existingCode.createTime.getTime()) / 60000);
      
      // 如果上一个验证码发送时间不到1分钟，则拒绝发送新验证码
      if (diffInMinutes < 1) {
        return {
          success: false,
          message: '请求过于频繁，请稍后再试',
        };
      }
    }

    // 生成新验证码
    const code = this.generateCode();
    
    // 设置过期时间为10分钟后
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 10);

    // 创建验证码记录
    const verification = this.verificationRepository.create({
      email,
      code,
      type,
      used: false,
    });
    
    // 手动设置过期时间
    verification.expireTime = expireTime;

    await this.verificationRepository.save(verification);

    // 发送验证码邮件
    const emailSent = await this.sendVerificationEmail(email, code, type);

    if (!emailSent) {
      return {
        success: false,
        message: '验证码发送失败，请稍后再试',
      };
    }

    return {
      success: true,
      message: '验证码已发送，请查收邮件',
    };
  }

  // 验证验证码
  async verifyCode(verifyCodeDto: VerifyCodeDto): Promise<boolean> {
    const { email, code, type } = verifyCodeDto;

    // 查找匹配的验证码记录
    const verification = await this.verificationRepository.findOne({
      where: {
        email,
        code,
        type,
        used: false,
      },
    });

    if (!verification) {
      throw new BadRequestException('验证码无效');
    }

    // 检查是否过期
    const now = new Date();
    if (now > verification.expireTime) {
      throw new BadRequestException('验证码已过期');
    }

    // 标记验证码为已使用
    verification.used = true;
    await this.verificationRepository.save(verification);

    return true;
  }
} 