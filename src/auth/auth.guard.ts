import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { maskAuthorizationHeader, maskToken } from 'src/common/utils/mask-token.util';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly jwtService: JwtService) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const requestMeta = `${request.method} ${request.originalUrl || request.url || ''}`;

    // 更严格的token提取逻辑
    if (!authHeader || typeof authHeader !== 'string') {
      this.logger.error(`无效的token：未提供Authorization头 | ${requestMeta}`);
      return false;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.error(
        `无效的token：Authorization格式错误，应为 "Bearer <token>" | ${requestMeta} | authorization=${maskAuthorizationHeader(authHeader)}`,
      );
      return false;
    }

    const token = parts[1];
    if (!token || token.trim() === '') {
      this.logger.error(`无效的token：token为空 | ${requestMeta}`);
      return false;
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET // 确保使用相同的密钥
      });

      // 只要存在userId加上email或openId之一就算验证通过
      if (!decoded.userId) {
        this.logger.error('无效的token：缺少userId');
        return false;
      }

      if (!decoded.email && !decoded.openId) {
        this.logger.error('无效的token：缺少email或openId');
        return false;
      }

      this.logger.log(
        `验证成功 | ${requestMeta} | authorization=${maskAuthorizationHeader(authHeader)} | decoded=${JSON.stringify(decoded)}`,
      );
      request.user = decoded; // 在请求中添加用户信息
      return true; // 验证成功
    } catch (e) {
      this.logger.error(`Token验证失败 | ${requestMeta} | ${e.message}`);
      this.logger.error(`问题Token: ${maskToken(token)}`);
      return false; // 验证失败
    }
  }
}
