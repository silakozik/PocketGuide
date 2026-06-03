import { Controller, Get, Query, Inject } from '@nestjs/common';
import { cities, users, travelPhotos } from '@pocketguide/database';
import { ilike, or, eq, and, isNull } from 'drizzle-orm';

@Controller('search')
export class SearchController {
  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  /**
   * GET /api/search?q=istanbul&type=all
   * type: 'cities' | 'users' | 'photos' | 'all'
   */
  @Get()
  async search(
    @Query('q') q: string,
    @Query('type') type = 'all',
  ) {
    if (!q || q.trim().length < 2) return { cities: [], users: [], photos: [] };

    const term = `%${q.trim()}%`;
    const results: any = { cities: [], users: [], photos: [] };

    if (type === 'all' || type === 'cities') {
      results.cities = await this.db
        .select({
          slug: cities.slug,
          nameTr: cities.nameTr,
          nameEn: cities.nameEn,
          countryCode: cities.countryCode,
        })
        .from(cities)
        .where(
          or(
            ilike(cities.nameTr as any, term),
            ilike(cities.nameEn as any, term),
            ilike(cities.slug as any, term),
          ),
        )
        .limit(5);
    }

    if (type === 'all' || type === 'users') {
      results.users = await this.db
        .select({
          id: users.id,
          userName: users.userName,
          email: users.email,
        })
        .from(users)
        .where(ilike(users.userName as any, term))
        .limit(5);
    }

    if (type === 'all' || type === 'photos') {
      results.photos = await this.db
        .select({
          id: travelPhotos.id,
          imageUrl: travelPhotos.imageUrl,
          caption: travelPhotos.caption,
          cityName: travelPhotos.cityName,
          userId: travelPhotos.userId,
        })
        .from(travelPhotos)
        .where(
          and(
            eq(travelPhotos.isPublic as any, true),
            isNull(travelPhotos.deletedAt as any),
            or(
              ilike(travelPhotos.caption as any, term),
              ilike(travelPhotos.cityName as any, term),
            ),
          ),
        )
        .limit(6);
    }

    return results;
  }
}
