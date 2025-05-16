import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User, LoginType } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateWechatLoginDto } from './dto/create-wechat-login.dto';
import { CreateEmailUserDto } from './dto/create-email-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { CreateGithubLoginDto } from './dto/github-login.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }
  async emailRegister(createEmailUserDto: CreateEmailUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: createEmailUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }
    // 添加正则表达式
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(createEmailUserDto.email)) {
      throw new ConflictException('邮箱格式不正确');
    }
    // 创建新用户
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = this.hashPassword(createEmailUserDto.password, salt);
    const user = this.userRepository.create({
      ...createEmailUserDto,
      password: `${salt}:${hashedPassword}`,
      loginType: LoginType.EMAIL,
    });

    await this.userRepository.save(user);

    // 生成 JWT 令牌
    const payload = { userId: user.id, email: user.email };
    user.token = this.jwtService.sign(payload);

    return user;
  }

  async emailLogin(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email, loginType: LoginType.EMAIL },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const isPasswordValid = this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 生成 JWT 令牌
    const payload = { userId: user.id, email: user.email };
    user.token = this.jwtService.sign(payload);

    return user;
  }

  // 使用 crypto 哈希密码
  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  // 验证密码
  private verifyPassword(password: string, storedPassword: string): boolean {
    const [salt, hashedPassword] = storedPassword.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashedPassword;
  }

  async wechatLogin(
    code: string,
    platform: 'mini' | 'official',
  ): Promise<User> {
    let response;
    // 根据不同平台调用不同的微信 API
    if (platform === 'mini') {
      // 小程序登录
      response = await axios.get(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`,
      );
    } else if (platform === 'official') {
      // 公众号登录
      response = await axios.get(
        `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_OFFICIAL_ID}&secret=${process.env.WECHAT_OFFICIAL_SECRET}&code=${code}&grant_type=authorization_code`,
      );
    }

    const { openid, session_key, errcode, errmsg } = response.data;
    console.log('🚀 ~ UserService ~ wechatLogin ~ openid:', response.data);
    if (errcode) {
      throw new Error(`WeChat API error: ${errmsg}`);
    }
    // 检查用户是否已存在
    let user = await this.userRepository.findOne({ where: { openId: openid } });

    if (!user) {
      // 如果用户不存在，创建新用户
      user = this.userRepository.create({
        openId: openid,
        nickname: '', // 初始值为空，后续可通过其他接口更新
        avatarUrl: '',
        loginType: platform === 'mini' ? LoginType.WECHAT_MINI : LoginType.WECHAT_OFFICIAL,
      });
      await this.userRepository.save(user);
    }
    console.log('🚀 ~ UserService ~ wechatLogin ~ user:', user);
    // 生成 JWT 令牌
    const payload = { userId: user.id, openId: user.openId };
    user.token = this.jwtService.sign(payload);
    return user;
  }

  async updateUser(id: number, userDto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    // 更新用户信息
    user.nickname = userDto.nickname || user.nickname;
    user.avatarUrl = userDto.avatarUrl || user.avatarUrl;

    await this.userRepository.save(user);
    return user;
  }

  async githubLogin(createGithubLoginDto: CreateGithubLoginDto): Promise<User> {
    const { code } = createGithubLoginDto;
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    });
    const { access_token } = response.data;
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const { login, avatar_url, email } = userResponse.data;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      const newUser = this.userRepository.create({
        email,
        loginType: LoginType.GITHUB,
        nickname: login,
        avatarUrl: avatar_url,
      });
      await this.userRepository.save(newUser);
      return newUser;
    }
    return user;
  }
}
