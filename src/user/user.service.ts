import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateWechatLoginDto } from './dto/create-wechat-login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}
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
}
