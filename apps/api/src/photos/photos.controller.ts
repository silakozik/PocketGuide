import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Inject,
  BadRequestException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { travelPhotos, users } from '@pocketguide/database';
import { eq, and, desc } from 'drizzle-orm';

@Controller('photos')
export class PhotosController {
  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  @Get('feed')
  async getFeed(@Query('limit') limit = '20') {
    const rows = await this.db
      .select({
        id: travelPhotos.id,
        imageUrl: travelPhotos.imageUrl,
        caption: travelPhotos.caption,
        cityName: travelPhotos.cityName,
        locationName: travelPhotos.locationName,
        createdAt: travelPhotos.createdAt,
        userId: travelPhotos.userId,
        userName: users.userName,
      })
      .from(travelPhotos)
      .leftJoin(users, eq(travelPhotos.userId as any, users.id))
      .where(eq(travelPhotos.isPublic as any, true))
      .orderBy(desc(travelPhotos.createdAt as any))
      .limit(Number(limit));
    return { data: rows };
  }

  @Get('user/:userId')
  async getUserPhotos(@Param('userId') userId: string) {
    const rows = await this.db
      .select()
      .from(travelPhotos)
      .where(
        and(
          eq(travelPhotos.userId as any, userId),
          eq(travelPhotos.isPublic as any, true),
        ),
      )
      .orderBy(desc(travelPhotos.createdAt as any));
    return { data: rows };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyPhotos(@Req() req: AuthenticatedRequest) {
    const rows = await this.db
      .select()
      .from(travelPhotos)
      .where(eq(travelPhotos.userId as any, req.userId))
      .orderBy(desc(travelPhotos.createdAt as any));
    return { data: rows };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async uploadPhoto(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      imageUrl: string;
      caption?: string;
      cityName?: string;
      locationName?: string;
      isPublic?: boolean;
    },
  ) {
    if (!body.imageUrl) throw new BadRequestException('imageUrl required');

    if (body.imageUrl.startsWith('data:')) {
      const base64 = body.imageUrl.split(',')[1] ?? '';
      const sizeBytes = (base64.length * 3) / 4;
      if (sizeBytes > 5 * 1024 * 1024) {
        throw new BadRequestException("Fotoğraf 5MB'dan küçük olmalı");
      }
    }

    const [photo] = await this.db
      .insert(travelPhotos)
      .values({
        userId: req.userId,
        imageUrl: body.imageUrl,
        caption: body.caption ?? null,
        cityName: body.cityName ?? null,
        locationName: body.locationName ?? null,
        isPublic: body.isPublic ?? true,
      } as any)
      .returning();

    return { success: true, data: photo };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const [photo] = await this.db
      .select()
      .from(travelPhotos)
      .where(eq(travelPhotos.id as any, id))
      .limit(1);

    if (!photo) throw new NotFoundException('Fotoğraf bulunamadı');
    if (photo.userId !== req.userId) {
      throw new BadRequestException('Bu fotoğrafı silme yetkiniz yok');
    }

    await this.db
      .delete(travelPhotos)
      .where(eq(travelPhotos.id as any, id));

    return { success: true };
  }
}
