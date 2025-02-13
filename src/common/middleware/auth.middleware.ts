import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // const token = req.headers['authorization'];
    // if (!token || token !== 'Bearer your_token') {
    //   throw new UnauthorizedException('Invalid or missing token');
    // }
    next();
  }
}
