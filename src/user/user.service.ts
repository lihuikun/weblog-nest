import { Injectable, ConflictException, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User, LoginType, Role } from '../user/entities/user.entity';
import { Repository, In } from 'typeorm';
import { CreateWechatLoginDto } from './dto/create-wechat-login.dto';
import { CreateEmailUserDto } from './dto/create-email-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { CreateGithubLoginDto } from './dto/github-login.dto';
import { VerificationService } from '../verification/verification.service';
import { VerificationType } from '../verification/entities/verification.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly verificationService: VerificationService,
  ) { }
  private readonly githubAppConfigs = {
    default: {
      redirect_uri: process.env.GITHUB_CALLBACK_URL,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
    },
    'js-daily': {
      redirect_uri: process.env.GITHUB_JS_DAILY_CALLBACK_URL,
      client_id: process.env.GITHUB_JS_DAILY_CLIENT_ID,
      client_secret: process.env.GITHUB_JS_DAILY_CLIENT_SECRET,
    },
  }
  // 统一生成JWT的方法
  private generateToken(payload: any): string {
    try {
      const token = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h'
      });
      this.logger.log(`生成token成功: ${JSON.stringify(payload)}`);
      return token;
    } catch (error) {
      this.logger.error(`生成token失败: ${error.message}`);
      throw error;
    }
  }

  async emailRegister(createEmailUserDto: CreateEmailUserDto): Promise<User> {
    const { email, password, code, nickname, avatarUrl } = createEmailUserDto;
    
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }
    
    // 添加正则表达式
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(email)) {
      throw new ConflictException('邮箱格式不正确');
    }
    
    // 验证验证码
    try {
      const isVerified = await this.verificationService.verifyCode({
        email,
        code,
        type: VerificationType.EMAIL_REGISTRATION,
      });
      
      if (!isVerified) {
        throw new BadRequestException('验证码无效');
      }
    } catch (error) {
      throw new BadRequestException(error.message || '验证码验证失败');
    }
    
    // 创建新用户
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = this.hashPassword(password, salt);
    const user = this.userRepository.create({
      email,
      password: `${salt}:${hashedPassword}`,
      nickname,
      avatarUrl,
      loginType: LoginType.EMAIL,
    });

    await this.userRepository.save(user);

    // 生成 JWT 令牌，仅使用userId和email
    const payload = { userId: user.id, email: user.email };
    user.token = this.generateToken(payload);

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

    // 生成 JWT 令牌，仅使用userId和email
    const payload = { userId: user.id, email: user.email };
    user.token = this.generateToken(payload);

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

  async checkUserRegistration(code: string): Promise<{
    isRegistered: boolean;
    user?: User;
    message: string;
  }> {
   const {data} = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&js_code=${code}&grant_type=authorization_code`,
    );
    const { openid } = data;
    const user = await this.userRepository.findOne({ where: { openId: openid } });
    if(user) {
      return {
        isRegistered: true,
        user,
        message: '用户已注册'
      }
    } else {
      return {
        isRegistered: false,
        message: '用户未注册，需要完善信息'
      }
    }
  }

  async wechatLogin(
    code: string,
    platform: 'mini' | 'official',
    nickname?: string,
    avatarUrl?: string,
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
    this.logger.log(`微信登录响应: ${JSON.stringify(response.data)}`);

    if (errcode) {
      throw new Error(`WeChat API error: ${errmsg}`);
    }
    // 检查用户是否已存在
    let user = await this.userRepository.findOne({ where: { openId: openid } });

    if (!user) {
      // 如果用户不存在，创建新用户
      user = this.userRepository.create({
        openId: openid,
        nickname: nickname || '', // 使用前端传递的昵称，如果没有则为空
        avatarUrl: avatarUrl || '', // 使用前端传递的头像，如果没有则为空
        loginType: platform === 'mini' ? LoginType.WECHAT_MINI : LoginType.WECHAT_OFFICIAL,
      });
      await this.userRepository.save(user);
    } else {
      // 如果用户已存在，更新昵称和头像（如果前端有传递）
      let needUpdate = false;
      
      if (nickname && user.nickname !== nickname) {
        user.nickname = nickname;
        needUpdate = true;
      }
      
      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        user.avatarUrl = avatarUrl;
        needUpdate = true;
      }
      
      if (needUpdate) {
        await this.userRepository.save(user);
        this.logger.log(`更新用户信息: ${JSON.stringify({ nickname, avatarUrl })}`);
      }
    }

    // 生成 JWT 令牌
    const payload = { userId: user.id, openId: user.openId };
    user.token = this.generateToken(payload);

    // 保存token到用户记录
    await this.userRepository.save(user);

    return user;
  }

  async githubLogin(createGithubLoginDto: CreateGithubLoginDto): Promise<User> {
    const { code,type='default' } = createGithubLoginDto;
    console.log('type', type)
    const config = this.githubAppConfigs[type];

    const response = await axios.post('https://github.com/login/oauth/access_token', {
      redirect_uri: config.redirect_uri,
      client_id: config.client_id,
      client_secret: config.client_secret,
      code,
    }, {
      headers: { 'accept': 'application/json' },
    });
    const { access_token } = response.data;
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const { login, avatar_url, email, id } = userResponse.data;
    this.logger.log(`GitHub登录响应: ${JSON.stringify(userResponse.data)}`);

    const user = await this.userRepository.findOne({ where: { openId: id.toString() } });
    if (!user) {
      const newUser = this.userRepository.create({
        openId: id.toString(),
        email,
        loginType: LoginType.GITHUB,
        nickname: login,
        avatarUrl: avatar_url,
      });
      await this.userRepository.save(newUser);

      // 生成 JWT 令牌
      const payload = { userId: newUser.id, openId: newUser.openId };
      newUser.token = this.generateToken(payload);

      // 保存token到用户记录
      await this.userRepository.save(newUser);

      return newUser;
    }

    // 生成 JWT 令牌
    const payload = { userId: user.id, openId: user.openId };
    user.token = this.generateToken(payload);
    user.nickname = login;
    user.avatarUrl = avatar_url;
    // 保存token到用户记录
    await this.userRepository.save(user);

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

  // 分页获取用户列表
  async getUserList(page: number = 1, pageSize: number = 10, keyword?: string) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    // 如果有关键词，添加模糊搜索条件
    if (keyword) {
      queryBuilder.where('user.nickname LIKE :keyword', { keyword: `%${keyword}%` })
        .orWhere('user.email LIKE :keyword', { keyword: `%${keyword}%` });
    }
    
    // 分页和排序
    queryBuilder.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('user.id', 'DESC');
    
    const [list, total] = await queryBuilder.getManyAndCount();
    return { list, total, page, pageSize };
  }

  // 删除用户
  async deleteUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new Error('用户不存在');
    await this.userRepository.remove(user);
    return { success: true };
  }

  // 部分字段更新用户
  async updateUserPartial(id: number, dto: Partial<CreateUserDto>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new Error('用户不存在');
    Object.assign(user, dto);
    await this.userRepository.save(user);
    return user;
  }

  // 获取用户角色 - 公共方法
  async getUserRole(userId: number): Promise<Role> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['role']
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user.role;
  }

  // 获取用户完整信息 - 公共方法
  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  // 批量获取用户基础信息 - 公共方法
  async getUsersBasicInfo(userIds: number[]): Promise<{ [key: number]: { id: number; nickname?: string; avatarUrl?: string } }> {
    if (!userIds.length) return {};

    const users = await this.userRepository.find({
      where: { id: In(userIds.filter(id => id)) }, // 使用In操作符进行批量查询
      select: ['id', 'nickname', 'avatarUrl']
    });

    // 转换为键值对格式便于查找
    return users.reduce((acc, user) => {
      acc[user.id] = {
        id: user.id,
        nickname: user.nickname || '未设置昵称',
        avatarUrl: user.avatarUrl || ''
      };
      return acc;
    }, {});
  }

  // 根据单个用户ID获取基础信息
  async getUserBasicInfo(userId: number): Promise<{ id: number; nickname?: string; avatarUrl?: string } | null> {
    if (!userId) return null;

    const usersInfo = await this.getUsersBasicInfo([userId]);
    return usersInfo[userId] || null;
  }
}
