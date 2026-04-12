import { Controller, Get, Param, Query, Inject, NotFoundException } from '@nestjs/common';
import { cities, adaptationPoints } from '@pocketguide/database';
import { eq, and } from 'drizzle-orm';

@Controller('api/adaptation')
export class AdaptationController {
  constructor(
    @Inject('DB_CONNECTION') private readonly db: any,
  ) {}

  /**
   * GET /api/adaptation/:citySlug
   * Returns all adaptation points for a city, optionally filtered by category
   */
  @Get(':citySlug')
  async getByCity(
    @Param('citySlug') citySlug: string,
    @Query('category') category?: string,
  ) {
    // 1. Get city info
    const [city] = await this.db
      .select()
      .from(cities)
      .where(eq(cities.slug, citySlug))
      .limit(1);

    if (!city) {
      throw new NotFoundException('Şehir bulunamadı.');
    }

    // 2. Build query for points
    const conditions = [eq(adaptationPoints.cityId, city.id), eq(adaptationPoints.isActive, true)];
    if (category) {
      conditions.push(eq(adaptationPoints.category, category));
    }

    const points = await this.db
      .select()
      .from(adaptationPoints)
      .where(and(...conditions));

    // Map to fit the existing frontend expectation if needed, or return raw
    // The frontend expects { id, name, category, address, lat, lng }
    return {
      city: {
        id: city.id,
        name: city.nameTr, // Defaulting to TR for Turkish users, or based on lang header later
        nameEn: city.nameEn,
        slug: city.slug,
      },
      data: points.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        address: p.address,
        lat: p.latitude,
        lng: p.longitude,
        openingHours: p.openingHours,
      })),
    };
  }
}
