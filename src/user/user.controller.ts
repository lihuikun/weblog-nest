import { Controller, Post, Body, Param, Put, Get, Delete, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiOperation, ApiParam, ApiTags, ApiQuery } from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { CreateWechatLoginDto } from './dto/create-wechat-login.dto';
import { CreateEmailUserDto } from './dto/create-email-user.dto';
import { EmailLoginDto } from './dto/email-login.dto';
import { CreateGithubLoginDto } from './dto/github-login.dto';
import { Pagination, PaginationParams } from '../common/decorators/pagination.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUserId } from 'src/common/decorators/require-role.decorator';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(private readonly authService: UserService) { }

  @Get('list')
  @ApiOperation({ summary: '获取用户分页列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词（支持昵称和邮箱模糊搜索）', example: '张三' })
  async getUserList(
    @Pagination() pagination: PaginationParams,
    @Query('keyword') keyword?: string
  ) {
    return this.authService.getUserList(pagination.page, pagination.pageSize, keyword);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async deleteUser(@Param('id') id: number) {
    return this.authService.deleteUser(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户信息（部分字段）' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiBody({ type: CreateUserDto })
  async updateUserPartial(
    @Param('id') id: number,
    @Body() userDto: Partial<CreateUserDto>,
  ): Promise<User> {
    return this.authService.updateUserPartial(id, userDto);
  }

  @Post('check-user')
  @ApiOperation({ summary: '检查用户注册状态' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '微信登录凭证' }
      },
      required: ['code']
    }
  })
  async checkUser(@Body() body: { code: string }): Promise<{
    isRegistered: boolean;
    user?: User;
    message: string;
  }> {
    return this.authService.checkUserRegistration(body.code);
  }

  @Post('mini-login')
  @ApiOperation({ summary: '微信登录' })
  @ApiBody({ type: CreateWechatLoginDto })
  async miniLogin(@Body() dto: CreateWechatLoginDto): Promise<User> {
    return this.authService.wechatLogin(dto.code, 'mini', dto.nickname, dto.avatarUrl);
  }

  @Post('official-login')
  @ApiOperation({ summary: '微信公众号登录' })
  @ApiBody({ type: CreateWechatLoginDto })
  async officialLogin(@Body() dto: CreateWechatLoginDto): Promise<string> {
    const encodedUri = encodeURIComponent(dto.redirectUri); // 对重定向 URI 进行 URL 编码
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${process.env.WECHAT_OFFICIAL_ID}&redirect_uri=${encodedUri}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`;
    // return this.authService.wechatLogin(dto.code, 'official');
  }

  @Post('email/register')
  @ApiOperation({ summary: '邮箱注册' })
  @ApiBody({ type: CreateEmailUserDto })
  async emailRegister(@Body() createEmailUserDto: CreateEmailUserDto): Promise<User> {
    return this.authService.emailRegister(createEmailUserDto);
  }

  @Post('email/login')
  @ApiOperation({ summary: '邮箱登录' })
  @ApiBody({ type: EmailLoginDto })
  async emailLogin(@Body() emailLoginDto: EmailLoginDto): Promise<User> {
    return this.authService.emailLogin(emailLoginDto.email, emailLoginDto.password);
  }

  //github 登录
  @Post('github/login')
  @ApiOperation({ summary: 'GitHub登录' })
  @ApiBody({ type: CreateGithubLoginDto })
  async githubLogin(@Body() createGithubLoginDto: CreateGithubLoginDto): Promise<User> {
    return this.authService.githubLogin(createGithubLoginDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '获取当前登录用户个人信息' })
  async getProfile(@CurrentUserId() userId: number) {
    return this.authService.getUserById(userId);
  }
}
