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
import { travelPhotos, users, photoComments } from '@pocketguide/database';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';

/** Keşfet / feed / arama — silinmemiş ve herkese açık */
function visiblePublicPhotosWhere() {
  return and(
    eq(travelPhotos.isPublic as any, true),
    isNull(travelPhotos.deletedAt as any),
  );
}

/** Profil — silinmemiş (gizli dahil) */
function notDeletedWhere() {
  return isNull(travelPhotos.deletedAt as any);
}

@Controller('photos')
export class PhotosController {
  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  /**
   * GET /api/photos/discover?interests=art,history&city=istanbul&limit=20&offset=0
   */
  @Get('discover')
  async getDiscover(
    @Query('interests') interestsStr?: string,
    @Query('city') city?: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
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
        likeCount: sql<number>`COALESCE("travel_photos"."likeCount", 0)`.as(
          'likeCount',
        ),
        saveCount: sql<number>`COALESCE("travel_photos"."saveCount", 0)`.as(
          'saveCount',
        ),
      })
      .from(travelPhotos)
      .leftJoin(users, eq(travelPhotos.userId as any, users.id))
      .where(visiblePublicPhotosWhere())
      .orderBy(desc(travelPhotos.createdAt as any))
      .limit(200);

    const now = Date.now();
    const interests = interestsStr
      ? interestsStr.split(',').map((s) => s.trim().toLowerCase())
      : [];

    const INTEREST_KEYWORDS: Record<string, string[]> = {
      art: ['sanat', 'müze', 'galeri', 'art', 'museum'],
      gastronomy: ['yemek', 'restoran', 'kafe', 'food', 'restaurant'],
      history: ['tarihi', 'history', 'antik', 'ancient', 'tarih'],
      nature: ['doğa', 'park', 'nature', 'forest', 'orman'],
      nightlife: ['gece', 'bar', 'night', 'club'],
      shopping: ['alışveriş', 'shopping', 'çarşı', 'market'],
      architecture: ['mimari', 'yapı', 'bina', 'architecture', 'building'],
      music_events: ['müzik', 'konser', 'etkinlik', 'music', 'event'],
    };

    const scored = rows.map((photo: any) => {
      let score = 0;

      const ageHours =
        (now - new Date(photo.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours < 48) score += Math.round(30 * (1 - ageHours / 48));

      score += (photo.likeCount ?? 0) * 3;
      score += (photo.saveCount ?? 0) * 5;

      if (city && photo.cityName?.toLowerCase().includes(city.toLowerCase())) {
        score += 15;
      }

      const content =
        `${photo.caption ?? ''} ${photo.cityName ?? ''}`.toLowerCase();
      for (const interest of interests) {
        const keywords = INTEREST_KEYWORDS[interest] ?? [];
        if (keywords.some((kw) => content.includes(kw))) score += 20;
      }

      return { ...photo, score };
    });

    scored.sort((a: any, b: any) => b.score - a.score);

    const offsetNum = Number(offset);
    const limitNum = Number(limit);
    const paginated = scored.slice(offsetNum, offsetNum + limitNum);

    return { data: paginated, total: scored.length };
  }

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
      .where(visiblePublicPhotosWhere())
      .orderBy(desc(travelPhotos.createdAt as any))
      .limit(Number(limit));
    return { data: rows };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyPhotos(@Req() req: AuthenticatedRequest) {
    const rows = await this.db
      .select()
      .from(travelPhotos)
      .where(
        and(eq(travelPhotos.userId as any, req.userId), notDeletedWhere()),
      )
      .orderBy(desc(travelPhotos.createdAt as any));
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
          notDeletedWhere(),
        ),
      )
      .orderBy(desc(travelPhotos.createdAt as any));
    return { data: rows };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likePhoto(@Param('id') id: string) {
    const [photo] = await this.db
      .select({ likeCount: travelPhotos.likeCount })
      .from(travelPhotos)
      .where(and(eq(travelPhotos.id as any, id), notDeletedWhere()))
      .limit(1);

    if (!photo) throw new NotFoundException('Fotoğraf bulunamadı');

    const nextCount = (photo.likeCount ?? 0) + 1;
    await this.db
      .update(travelPhotos)
      .set({ likeCount: nextCount } as any)
      .where(eq(travelPhotos.id as any, id));

    return { success: true, likeCount: nextCount };
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    const [photo] = await this.db
      .select({ id: travelPhotos.id })
      .from(travelPhotos)
      .where(
        and(
          eq(travelPhotos.id as any, id),
          notDeletedWhere(),
          eq(travelPhotos.isPublic as any, true),
        ),
      )
      .limit(1);

    if (!photo) throw new NotFoundException('Fotoğraf bulunamadı');

    const rows = await this.db
      .select({
        id: photoComments.id,
        body: photoComments.body,
        createdAt: photoComments.createdAt,
        userId: photoComments.userId,
        userName: users.userName,
      })
      .from(photoComments)
      .leftJoin(users, eq(photoComments.userId as any, users.id))
      .where(eq(photoComments.photoId as any, id))
      .orderBy(desc(photoComments.createdAt as any));

    return { data: rows.reverse() };
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Param('id') id: string,
    @Body('body') body: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const text = body?.trim();
    if (!text) throw new BadRequestException('Yorum boş olamaz');

    const [photo] = await this.db
      .select({ id: travelPhotos.id })
      .from(travelPhotos)
      .where(
        and(
          eq(travelPhotos.id as any, id),
          notDeletedWhere(),
          eq(travelPhotos.isPublic as any, true),
        ),
      )
      .limit(1);

    if (!photo) throw new NotFoundException('Fotoğraf bulunamadı');

    const [comment] = await this.db
      .insert(photoComments)
      .values({
        photoId: id,
        userId: req.userId,
        body: text,
      } as any)
      .returning();

    const [user] = await this.db
      .select({ userName: users.userName })
      .from(users)
      .where(eq(users.id as any, req.userId))
      .limit(1);

    return {
      success: true,
      data: {
        ...comment,
        userName: user?.userName ?? 'Kullanıcı',
      },
    };
  }

  @Get(':id')
  async getPhoto(@Param('id') id: string) {
    const [row] = await this.db
      .select({
        id: travelPhotos.id,
        imageUrl: travelPhotos.imageUrl,
        caption: travelPhotos.caption,
        cityName: travelPhotos.cityName,
        locationName: travelPhotos.locationName,
        createdAt: travelPhotos.createdAt,
        userId: travelPhotos.userId,
        userName: users.userName,
        likeCount: sql<number>`COALESCE("travel_photos"."likeCount", 0)`.as(
          'likeCount',
        ),
      })
      .from(travelPhotos)
      .leftJoin(users, eq(travelPhotos.userId as any, users.id))
      .where(
        and(
          eq(travelPhotos.id as any, id),
          notDeletedWhere(),
          eq(travelPhotos.isPublic as any, true),
        ),
      )
      .limit(1);

    if (!row) throw new NotFoundException('Fotoğraf bulunamadı');
    return { data: row };
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
      .where(
        and(eq(travelPhotos.id as any, id), notDeletedWhere()),
      )
      .limit(1);

    if (!photo) throw new NotFoundException('Fotoğraf bulunamadı');
    if (photo.userId !== req.userId) {
      throw new BadRequestException('Bu fotoğrafı silme yetkiniz yok');
    }

    await this.db
      .update(travelPhotos)
      .set({ deletedAt: new Date() } as any)
      .where(eq(travelPhotos.id as any, id));

    return { success: true };
  }
}
