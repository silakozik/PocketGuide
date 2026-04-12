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
import { eq, sql, and, count } from 'drizzle-orm';

@Controller('api/admin/cities')
@UseGuards(AdminGuard)
export class AdminCityController {
  private readonly logger = new Logger(AdminCityController.name);

  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  /**
   * GET /api/admin/cities
   * Returns all cities with POI counts per category
   */
  @Get()
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
  @Post()
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
  @Post('import')
  async importCity(
    @Body() body: { citySlug: string; cityName: string; countryCode?: string },
    @Res() res: Response,
  ) {
    const { citySlug, cityName, countryCode } = body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      // Step 1: Ensure city exists
      sendEvent({ step: 'city', status: 'loading', message: 'Şehir kontrol ediliyor...' });
      
      let [city] = await this.db
        .select()
        .from(cities)
        .where(eq(cities.slug, citySlug))
        .limit(1);

      if (!city) {
        [city] = await this.db
          .insert(cities)
          .values({
            slug: citySlug,
            nameEn: cityName,
            nameTr: cityName,
            countryCode: (countryCode || 'XX').toUpperCase(),
          })
          .returning();
        sendEvent({ step: 'city', status: 'done', message: `Şehir oluşturuldu: ${cityName}` });
      } else {
        sendEvent({ step: 'city', status: 'done', message: `Şehir bulundu: ${city.nameEn}` });
      }

      const cityId = city.id;
      let totalImported = 0;

      // Step 2: Fetch SIM card shops (shop=mobile_phone)
      sendEvent({ step: 'sim', status: 'loading', message: 'SIM satış noktaları aranıyor...' });
      const simPois = await this.fetchOSMByTag(cityName, 'shop', 'mobile_phone');
      const simInserted = await this.insertPois(simPois, cityId, 'sim_card');
      totalImported += simInserted;
      sendEvent({ step: 'sim', status: 'done', message: `SIM noktaları`, count: simInserted });

      // Step 3: Fetch Transport (railway=station, highway=bus_stop)
      sendEvent({ step: 'transport', status: 'loading', message: 'Ulaşım noktaları aranıyor...' });
      const transportPois = await this.fetchOSMByTag(cityName, 'public_transport', 'station');
      const transportInserted = await this.insertPois(transportPois, cityId, 'transport_stop');
      totalImported += transportInserted;
      sendEvent({ step: 'transport', status: 'done', message: `Ulaşım noktaları`, count: transportInserted });

      // Step 4: Fetch Exchange offices (amenity=bureau_de_change)
      sendEvent({ step: 'exchange', status: 'loading', message: 'Döviz büroları aranıyor...' });
      const exchangePois = await this.fetchOSMByTag(cityName, 'amenity', 'bureau_de_change');
      const exchangeInserted = await this.insertPois(exchangePois, cityId, 'exchange');
      totalImported += exchangeInserted;
      sendEvent({ step: 'exchange', status: 'done', message: `Döviz büroları`, count: exchangeInserted });

      // Step 5: Update lastSyncedAt
      await this.db
        .update(cities)
        .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
        .where(eq(cities.id, cityId));

      sendEvent({
        step: 'complete',
        status: 'done',
        message: 'Import tamamlandı!',
        total: totalImported,
        breakdown: {
          sim: simInserted,
          transport: transportInserted,
          exchange: exchangeInserted,
        },
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
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const [updated] = await this.db
      .update(cities)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(cities.id, id))
      .returning();

    return updated;
  }

  /**
   * DELETE /api/admin/cities/:id
   * Delete a city and all its POIs (cascade via FK)
   */
  @Delete(':id')
  @HttpCode(200)
  async deleteCity(@Param('id') id: string) {
    // Delete POIs first (in case cascade isn't working)
    await this.db.delete(pois).where(eq(pois.cityId, id));
    // Delete the city
    await this.db.delete(cities).where(eq(cities.id, id));
    return { success: true, message: 'Şehir ve ilgili veriler silindi.' };
  }

  // ── Helpers ──

  private async fetchOSMByTag(
    cityName: string,
    key: string,
    value: string,
  ): Promise<Array<{ name: string; lat: number; lng: number }>> {
    const query = `
      [out:json][timeout:25];
      area[name="${cityName}"]->.searchArea;
      node["${key}"="${value}"](area.searchArea);
      out body;
    `;

    try {
      const res = await fetch(
        `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`,
      );
      const text = await res.text();
      const data = JSON.parse(text);
      return (data.elements || []).map((el: any) => ({
        name: el.tags?.name || `${value} (${el.id})`,
        lat: el.lat,
        lng: el.lon,
      }));
    } catch (err: any) {
      this.logger.warn(`OSM fetch failed for ${key}=${value}: ${err.message}`);
      return [];
    }
  }

  private async insertPois(
    rawPois: Array<{ name: string; lat: number; lng: number }>,
    cityId: string,
    category: string,
  ): Promise<number> {
    if (rawPois.length === 0) return 0;

    const values = rawPois.map((p) => ({
      name: p.name,
      cityId,
      category,
      provider: 'osm' as const,
      sourceId: `osm_${category}_${p.lat}_${p.lng}`,
      location: { lng: p.lng, lat: p.lat },
    }));

    try {
      await this.db.insert(pois).values(values).onConflictDoNothing();
      return values.length;
    } catch (err: any) {
      this.logger.error(`Insert error: ${err.message}`);
      return 0;
    }
  }
}
