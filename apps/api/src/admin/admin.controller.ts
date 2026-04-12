import { Controller, Post, Get, Body, Res, Req, UnauthorizedException, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { Response, Request } from 'express';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly configService: ConfigService) {}

  @Post('login')
  @HttpCode(200)
  login(
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', '');

    if (!password || password !== adminPassword) {
      throw new UnauthorizedException('Geçersiz şifre');
    }

    const token = createHmac('sha256', adminPassword)
      .update('pocketguide-admin')
      .digest('hex');

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return { success: true, message: 'Giriş başarılı' };
  }

  @Get('me')
  me(@Req() req: Request) {
    const token = req.cookies?.['admin_token'];
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD', '');
    const expectedToken = createHmac('sha256', adminPassword)
      .update('pocketguide-admin')
      .digest('hex');

    if (!token || token !== expectedToken) {
      throw new UnauthorizedException('Not authenticated');
    }

    return { authenticated: true };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_token', { path: '/' });
    return { success: true };
  }
}
