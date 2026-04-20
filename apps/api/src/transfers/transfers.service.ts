import { Injectable, Inject, Logger } from '@nestjs/common';
import { transferRoutes, transportCards, cities } from '@pocketguide/database';
import { eq, and, sql } from 'drizzle-orm';
import { TransitImporter } from './transit-importer.service';
import { TransferRouteDTO, TransportCardDTO } from '@pocketguide/types';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    @Inject('DB_CONNECTION') private readonly db: any,
    private readonly transitImporter: TransitImporter,
  ) {}

  async findAllRoutes(filters: { cityId?: string; type?: string; mode?: string }) {
    let query = this.db.select().from(transferRoutes);
    
    const conditions = [];
    if (filters.cityId) conditions.push(eq(transferRoutes.cityId as any, filters.cityId));
    if (filters.type) conditions.push(eq(transferRoutes.type as any, filters.type));
    if (filters.mode) conditions.push(eq(transferRoutes.mode as any, filters.mode));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query;
  }

  async createRoute(data: Partial<TransferRouteDTO>) {
    return this.db.insert(transferRoutes).values({
      ...data,
      lastUpdated: new Date(),
    }).returning();
  }

  async updateRoute(id: string, data: Partial<TransferRouteDTO>) {
    return this.db.update(transferRoutes)
      .set({ ...data, lastUpdated: new Date() } as any)
      .where(eq(transferRoutes.id as any, id))
      .returning();
  }

  async deleteRoute(id: string) {
    return this.db.delete(transferRoutes).where(eq(transferRoutes.id as any, id)).returning();
  }

  async findAllCards(cityId?: string) {
    if (cityId) {
      return this.db.select().from(transportCards).where(eq(transportCards.cityId as any, cityId));
    }
    return this.db.select().from(transportCards);
  }

  async importFromOSM(cityId: string, onProgress?: (progress: any) => void) {
    const [city] = await this.db.select().from(cities).where(eq(cities.id as any, cityId)).limit(1);
    if (!city) throw new Error('City not found');

    onProgress?.({ message: `${city.nameEn} için OSM verileri çekiliyor...`, status: 'loading' });
    
    const osmRoutes = await this.transitImporter.fetchCityRoutes(city.nameEn);
    this.logger.log(`Fetched ${osmRoutes.length} routes from OSM for ${city.nameEn}`);

    let added = 0;
    let updated = 0;

    for (const route of osmRoutes) {
      // Check if already exists by sourceId
      // Note: I should probably add sourceId to the schema if I want to avoid duplicates properly
      // but for now I'll use name + from + to as a heuristic if sourceId is not in schema.
      // Wait, I didn't add sourceId to schema. I'll add it or search by other fields.
      
      const [existing] = await this.db.select()
        .from(transferRoutes)
        .where(and(
          eq(transferRoutes.cityId as any, cityId),
          eq(transferRoutes.name as any, route.name),
          eq(transferRoutes.fromPoint as any, route.from),
          eq(transferRoutes.toPoint as any, route.to)
        ))
        .limit(1);

      const routeData = {
        cityId,
        type: 'intracity', // OSM routes are usually intracity
        mode: route.mode,
        name: route.name,
        fromPoint: route.from,
        toPoint: route.to,
        frequency: route.frequency,
        operatingHours: route.operatingHours,
        source: 'osm',
        isActive: true,
        lastUpdated: new Date(),
      };

      if (existing) {
        await this.db.update(transferRoutes)
          .set(routeData as any)
          .where(eq(transferRoutes.id as any, existing.id));
        updated++;
      } else {
        await this.db.insert(transferRoutes).values(routeData);
        added++;
      }
    }

    onProgress?.({ 
      message: `İşlem tamamlandı: ${added} yeni rota eklendi, ${updated} rota güncellendi.`, 
      status: 'done',
      summary: { added, updated }
    });

    return { added, updated };
  }
}
