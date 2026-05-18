import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

export type JwtPayload = { sub: string; email: string };

export type AuthenticatedRequest = Request & {
  userId: string;
  userEmail: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private extractToken(req: Request): string | undefined {
    const cookie = req.cookies?.["pg_access_token"] as string | undefined;
    if (cookie) return cookie;
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      return header.slice(7).trim();
    }
    return undefined;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException("Oturum bulunamadı");
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>("JWT_SECRET", "dev-jwt-secret"),
      });
      req.userId = payload.sub;
      req.userEmail = payload.email;
      return true;
    } catch {
      throw new UnauthorizedException("Geçersiz veya süresi dolmuş oturum");
    }
  }
}
