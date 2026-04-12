import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Inject,
  UseGuards,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminGuard } from './admin.guard';
import { cities, pois } from '@pocketguide/database';
import { eq, count } from 'drizzle-orm';
import { CityPipeline } from './services/cityPipeline';

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminCityController {
  private readonly logger = new Logger(AdminCityController.name);

  constructor(
    @Inject('DB_CONNECTION') private readonly db: any,
    private readonly cityPipeline: CityPipeline,
  ) {}

  /**
   * GET /api/admin/cities
   * Returns all cities with POI counts per category
   */
  @Get('cities')
  async listCities() {
    // Get all cities
    const allCities = await this.db.select().from(cities).orderBy(cities.createdAt);

    // Get POI counts grouped by city and category
    const poiCounts = await this.db
      .select({
        cityId: pois.cityId,
        category: pois.category,
        count: count(),
      })
      .from(pois)
      .groupBy(pois.cityId, pois.category);

    // Build a map for fast lookup
    const countMap: Record<string, Record<string, number>> = {};
    for (const row of poiCounts) {
      if (!row.cityId) continue;
      if (!countMap[row.cityId]) countMap[row.cityId] = {};
      countMap[row.cityId][row.category] = Number(row.count);
    }

    return allCities.map((city: any) => ({
      ...city,
      poiCounts: countMap[city.id] || {},
    }));
  }

  /**
   * POST /api/admin/cities
   * Create a new city
   */
  @Post('cities')
  async createCity(
    @Body() body: { cityName: string; citySlug: string; countryCode: string },
  ) {
    const { cityName, citySlug, countryCode } = body;

    const [newCity] = await this.db
      .insert(cities)
      .values({
        slug: citySlug,
        nameEn: cityName,
        nameTr: cityName,
        countryCode: countryCode.toUpperCase(),
      })
      .returning();

    return newCity;
  }

  /**
   * POST /api/admin/import-city
   * Import POIs from OSM for a given city using SSE
   */
  @Post('import-city')
  async importCity(
    @Body() body: { citySlug: string; cityName: string },
    @Res() res: Response,
  ) {
    const { citySlug, cityName } = body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const results = await this.cityPipeline.importCityData(
        citySlug,
        cityName,
        sendEvent,
      );

      sendEvent({
        step: 'complete',
        status: 'done',
        message: 'Import başarıyla tamamlandı!',
        results,
      });
    } catch (error: any) {
      this.logger.error('Import error:', error);
      sendEvent({ step: 'error', status: 'error', message: error.message || 'Bilinmeyen hata' });
    } finally {
      res.end();
    }
  }

  /**
   * PATCH /api/admin/cities/[slug]
   * Toggle city status (active/passive)
   */
  @Patch('cities/:slug')
  async toggleStatus(@Param('slug') slug: string, @Body() body: { status: string }) {
    const [updated] = await this.db
      .update(cities)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(cities.slug, slug))
      .returning();

    return updated;
  }

  /**
   * DELETE /api/admin/cities/[slug]
   * Delete a city and all its POIs via slug
   */
  @Delete('cities/:slug')
  @HttpCode(200)
  async deleteCity(@Param('slug') slug: string) {
    // Find city first to get ID for POI deletion if needed (though FK should handle it)
    const [city] = await this.db.select().from(cities).where(eq(cities.slug, slug)).limit(1);
    
    if (!city) {
      return { success: false, message: 'Şehir bulunamadı.' };
    }

    // Delete POIs
    await this.db.delete(pois).where(eq(pois.cityId, city.id));
    // Delete the city
    await this.db.delete(cities).where(eq(cities.id, city.id));
    
    return { success: true, message: 'Şehir ve ilgili veriler silindi.' };
  }
}
