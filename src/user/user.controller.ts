import { Controller, Post, Body, Param, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { CreateWechatLoginDto } from './dto/create-wechat-login.dto';

@Controller('user')
export class UserController {
  constructor(private readonly authService: UserService) {}

  @Post('wechat-login')
  @ApiOperation({ summary: '微信登录' })
  @ApiBody({ type: CreateWechatLoginDto })
  async wechatLogin(@Body() dto: CreateWechatLoginDto): Promise<User> {
    return this.authService.wechatLogin(dto);
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
