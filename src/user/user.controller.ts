import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { CreateWechatLoginDto } from './dto/create-wechat-login.dto';

@Controller('user')
export class UserController {
  constructor(private readonly authService: UserService) {}

  @Post('mini-login')
  @ApiOperation({ summary: '微信登录' })
  @ApiBody({ type: CreateWechatLoginDto })
  async miniLogin(@Body() dto: CreateWechatLoginDto): Promise<User> {
    return this.authService.wechatLogin(dto.code, 'mini');
  }

  @Post('official-login')
  @ApiOperation({ summary: '微信公众号登录' })
  @ApiBody({ type: CreateWechatLoginDto })
  async officialLogin(@Body() dto: CreateWechatLoginDto): Promise<string> {
    const encodedUri = encodeURIComponent(dto.redirectUri); // 对重定向 URI 进行 URL 编码
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.WECHAT_OFFICIAL_ID}&redirect_uri=${encodedUri}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`;
    // return this.authService.wechatLogin(dto.code, 'official');
  }

  @Put('update-user/:id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiBody({ type: CreateUserDto })
  async updateUser(
    @Param('id') id: number,
    @Body() userDto: CreateUserDto,
  ): Promise<User> {
    return this.authService.updateUser(id, userDto);
  }
}
