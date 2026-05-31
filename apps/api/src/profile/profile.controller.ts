import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { userProfiles } from '@pocketguide/database';
import { eq } from 'drizzle-orm';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  @Get('me')
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.userId;
    const [profile] = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId as any, userId))
      .limit(1);
    return profile ?? { userId, avatarUrl: null, displayName: null, bio: null };
  }

  @Put('avatar')
  async updateAvatar(
    @Req() req: AuthenticatedRequest,
    @Body() body: { avatarUrl: string },
  ) {
    if (!body.avatarUrl) throw new BadRequestException('avatarUrl required');

    if (body.avatarUrl.startsWith('data:')) {
      const base64Data = body.avatarUrl.split(',')[1] ?? '';
      const sizeInBytes = (base64Data.length * 3) / 4;
      if (sizeInBytes > 2 * 1024 * 1024) {
        throw new BadRequestException("Fotoğraf 2MB'dan küçük olmalı");
      }
    }

    const userId = req.userId;

    const [existing] = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId as any, userId))
      .limit(1);

    if (existing) {
      await this.db
        .update(userProfiles)
        .set({ avatarUrl: body.avatarUrl, updatedAt: new Date() } as any)
        .where(eq(userProfiles.userId as any, userId));
    } else {
      await this.db.insert(userProfiles).values({
        userId,
        avatarUrl: body.avatarUrl,
      } as any);
    }

    return { success: true, avatarUrl: body.avatarUrl };
  }

  @Put('me')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: { displayName?: string; bio?: string },
  ) {
    const userId = req.userId;
    const [existing] = await this.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId as any, userId))
      .limit(1);

    if (existing) {
      await this.db
        .update(userProfiles)
        .set({ ...body, updatedAt: new Date() } as any)
        .where(eq(userProfiles.userId as any, userId));
    } else {
      await this.db.insert(userProfiles).values({ userId, ...body } as any);
    }

    return { success: true };
  }
}
