import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.['admin_token'];

    if (!token) {
      throw new UnauthorizedException('Admin token missing');
    }

    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', '');
    const expectedToken = createHmac('sha256', adminPassword)
      .update('pocketguide-admin')
      .digest('hex');

    if (token !== expectedToken) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}
