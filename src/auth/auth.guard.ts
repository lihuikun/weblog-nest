import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.split(' ')[1]; // 获取 Bearer token

    if (!token) {
      return false; // 没有 token，返回 false
    }

    try {
      const decoded = this.jwtService.verify(token); // 验证 token
      console.log('🚀 ~ AuthGuard ~ canActivate ~ decoded:', decoded);
      request.user = decoded; // 在请求中添加用户信息
      return true; // 验证成功
    } catch (e) {
      console.log('🚀 ~ AuthGuard ~ canActivate ~ e:', e);
      return false; // 验证失败
    }
  }
}
