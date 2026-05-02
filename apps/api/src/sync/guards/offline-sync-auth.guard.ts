import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Bearer token ile eşleşen `OFFLINE_SYNC_SECRET`; batch sync için. */
@Injectable()
export class OfflineSyncAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('OFFLINE_SYNC_SECRET');
    if (!secret) {
      throw new UnauthorizedException(
        'OFFLINE_SYNC_SECRET is not configured on the server',
      );
    }
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string> }>();
    const auth = req.headers?.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token || token !== secret) {
      throw new UnauthorizedException('Invalid sync token');
    }
    return true;
  }
}
