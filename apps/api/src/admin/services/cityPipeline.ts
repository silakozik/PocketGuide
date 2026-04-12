import { Injectable, Inject, Logger } from '@nestjs/common';
import { OverpassImporter, OverpassPOI } from './overpassImporter';
import { cities, pois } from '@pocketguide/database';
import { eq, and } from 'drizzle-orm';
import { calculateDistance } from '../../places/normalization/utils/geo.util';

@Injectable()
export class CityPipeline {
  private readonly logger = new Logger(CityPipeline.name);

  constructor(
    private readonly overpassImporter: OverpassImporter,
    @Inject('DB_CONNECTION') private readonly db: any,
  ) {}

  /**
   * Imports city data for 3 categories sequentially with deduplication.
   */
  async importCityData(
    citySlug: string,
    cityName: string,
    onProgress?: (data: any) => void,
  ): Promise<Record<string, number>> {
    const categories = ['sim', 'transport', 'exchange'];
    const results: Record<string, number> = {};

    // 1. Ensure city exists and get ID
    onProgress?.({ step: 'city', status: 'loading', message: 'Şehir aranıyor...' });
    let [city] = await this.db.select().from(cities).where(eq(cities.slug, citySlug)).limit(1);

    if (!city) {
      this.logger.log(`City not found for slug ${citySlug}, creating...`);
      [city] = await this.db.insert(cities).values({
        slug: citySlug,
        nameEn: cityName,
        nameTr: cityName,
        countryCode: 'XX', // Default or fetch if available
      }).returning();
      onProgress?.({ step: 'city', status: 'done', message: `Şehir oluşturuldu: ${cityName}` });
    } else {
      onProgress?.({ step: 'city', status: 'done', message: `Şehir bulundu: ${city.nameEn}` });
    }

    const cityId = city.id;

    // 2. Fetch existing POIs for this city to help with deduplication
    const existingPois = await this.db.select().from(pois).where(eq(pois.cityId, cityId));

    // 3. Sequential fetch and process
    for (const category of categories) {
      onProgress?.({ step: category, status: 'loading', message: `${category.toUpperCase()} verileri getiriliyor...` });
      
      const rawPoints = await this.overpassImporter.fetchCityPoints(cityName, category);
      this.logger.log(`Fetched ${rawPoints.length} points for ${category}`);

      // Deduplicate by 100m radius
      const uniquePoints = this.deduplicatePoints(rawPoints, existingPois);
      this.logger.log(`Unique points for ${category}: ${uniquePoints.length}`);

      // Upsert to DB
      if (uniquePoints.length > 0) {
        const values = uniquePoints.map(p => ({
          sourceId: p.sourceId,
          provider: 'osm',
          name: p.name,
          cityId: cityId,
          category: this.mapToInternalCategory(category),
          address: p.address,
          location: { lng: p.longitude, lat: p.latitude },
        }));

        await this.db.insert(pois).values(values).onConflictDoNothing();
      }

      results[category] = uniquePoints.length;
      onProgress?.({ step: category, status: 'done', message: `${category.toUpperCase()} tamamlandı`, count: uniquePoints.length });

      // Wait 1s between categories to avoid rate limiting
      if (category !== categories[categories.length - 1]) {
        await this.overpassImporter.wait(1000);
      }
    }

    // 4. Update city sync status
    await this.db.update(cities)
      .set({ 
        lastSyncedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(cities.id, cityId));

    return results;
  }

  private deduplicatePoints(newPoints: OverpassPOI[], existingPois: any[]): OverpassPOI[] {
    const uniqueBatch: OverpassPOI[] = [];
    const RADIUS_THRESHOLD = 100; // 100 meters

    for (const newPoint of newPoints) {
      let isDuplicate = false;

      // Check against existing points in DB
      for (const existing of existingPois) {
        const dist = calculateDistance(
          newPoint.latitude, 
          newPoint.longitude, 
          existing.location.lat, 
          existing.location.lng
        );
        if (dist < RADIUS_THRESHOLD) {
          isDuplicate = true;
          break;
        }
      }

      // Check against current batch
      if (!isDuplicate) {
        for (const added of uniqueBatch) {
          const dist = calculateDistance(
            newPoint.latitude, 
            newPoint.longitude, 
            added.latitude, 
            added.longitude
          );
          if (dist < RADIUS_THRESHOLD) {
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        uniqueBatch.push(newPoint);
      }
    }

    return uniqueBatch;
  }

  private mapToInternalCategory(cat: string): string {
    const map: Record<string, string> = {
      sim: 'sim_card',
      transport: 'transport_tickets',
      exchange: 'exchange',
    };
    return map[cat] || cat;
  }
}
