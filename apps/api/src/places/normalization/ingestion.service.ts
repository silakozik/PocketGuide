import { Inject, Injectable, Logger } from '@nestjs/common';
import { NormalizedPOI, RawFoursquareVenue } from '@pocketguide/types';
import { pois } from '@pocketguide/database';
import { eq, inArray } from 'drizzle-orm';
import { mapFoursquareToPOI } from './mappers';
import { filterDuplicates } from './deduplicator';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  processFoursquare(
    rawItems: RawFoursquareVenue[],
    existingDbPois: NormalizedPOI[] = [],
    categoryOverride?: string,
  ): NormalizedPOI[] {
    const mapped = rawItems.map((raw) => mapFoursquareToPOI(raw, categoryOverride));
    return filterDuplicates(mapped, existingDbPois);
  }

  async loadExistingForCity(cityId: string): Promise<NormalizedPOI[]> {
    const rows = await this.db
      .select({
        sourceId: pois.sourceId,
        name: pois.name,
        category: pois.category,
        location: pois.location,
      })
      .from(pois)
      .where(eq(pois.cityId as any, cityId));

    return rows
      .filter((r: { sourceId: string | null }) => r.sourceId)
      .map(
        (r: {
          sourceId: string;
          name: string;
          category: string;
          location: { lat: number; lng: number };
        }) => ({
          sourceId: r.sourceId,
          provider: 'foursquare' as const,
          name: r.name,
          category: r.category,
          address: null,
          lat: r.location?.lat ?? 0,
          lng: r.location?.lng ?? 0,
        }),
      );
  }

  async bulkInsertToDb(uniquePois: NormalizedPOI[], cityId: string): Promise<number> {
    if (uniquePois.length === 0) return 0;

    const sourceIds = uniquePois.map((p) => p.sourceId);
    const existing = await this.db
      .select({ sourceId: pois.sourceId })
      .from(pois)
      .where(inArray(pois.sourceId as any, sourceIds));

    const existingSet = new Set(
      (existing as { sourceId: string | null }[])
        .map((r) => r.sourceId)
        .filter(Boolean),
    );

    const toInsert = uniquePois.filter((p) => !existingSet.has(p.sourceId));
    if (toInsert.length === 0) return 0;

    await this.db.insert(pois).values(
      toInsert.map((p) => ({
        sourceId: p.sourceId,
        provider: p.provider,
        name: p.name,
        cityId,
        category: String(p.category),
        address: p.address,
        description: p.subtype ?? null,
        rating: p.rating ?? null,
        priceLevel: p.priceLevel ?? null,
        location: { lng: p.lng, lat: p.lat },
      })),
    );

    this.logger.log(`Inserted ${toInsert.length} POIs for city ${cityId}`);
    return toInsert.length;
  }
}
