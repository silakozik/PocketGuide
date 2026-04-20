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
import { cities, pois, adaptationPoints } from '@pocketguide/database';
import { eq, count, or } from 'drizzle-orm';
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

    // Get counts from adaptation_points for the dashboard chips
    const adaptCounts = await this.db
      .select({
        cityId: adaptationPoints.cityId as any,
        category: adaptationPoints.category as any,
        count: count(),
      })
      .from(adaptationPoints)
      .groupBy(adaptationPoints.cityId as any, adaptationPoints.category as any);

    // Build a map for fast lookup
    const countMap: Record<string, Record<string, number>> = {};
    for (const row of adaptCounts) {
      if (!row.cityId) continue;
      if (!countMap[row.cityId]) countMap[row.cityId] = {};
      // Map to keys expected by frontend
      const uiKey = row.category === 'transport_card' ? 'transport_stop' : 
                    row.category === 'sim' ? 'sim_card' : row.category;
      countMap[row.cityId][uiKey] = Number(row.count);
    }

    return allCities.map((city: any) => ({
      ...city,
      status: city.isActive ? 'active' : 'passive', // map isActive to status for frontend compatibility
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
   * PATCH /api/admin/cities/:id/status
   * Toggle city status (active/passive)
   */
  @Patch('cities/:id/status')
  async toggleStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const [updated] = await this.db
      .update(cities)
      .set({ isActive: body.status === 'active', updatedAt: new Date() } as any)
      .where(eq(cities.id as any, id))
      .returning();

    return updated;
  }

  /**
   * DELETE /api/admin/cities/:id
   * Delete a city and all its POIs
   */
  @Delete('cities/:id')
  @HttpCode(200)
  async deleteCity(@Param('id') id: string) {
    // Delete Adaptation Points
    await this.db.delete(adaptationPoints).where(eq(adaptationPoints.cityId as any, id));
    // Delete regular POIs
    await this.db.delete(pois).where(eq(pois.cityId as any, id));
    // Delete the city
    await this.db.delete(cities).where(eq(cities.id as any, id));
    
    return { success: true, message: 'Şehir ve ilgili veriler silindi.' };
  }
}
