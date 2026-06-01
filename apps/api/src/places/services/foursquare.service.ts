import { Injectable, Logger } from '@nestjs/common';
import { RawFoursquareVenue } from '@pocketguide/types';
import { searchFoursquarePlaces } from '../utils/foursquare-client';

@Injectable()
export class FoursquareService {
  private readonly logger = new Logger(FoursquareService.name);

  async searchNearby(
    lat: number,
    lng: number,
    radius = 1500,
    limit = 20,
  ): Promise<RawFoursquareVenue[]> {
    return this.search({
      lat,
      lng,
      radius,
      limit,
    });
  }

  async searchByCategories(
    lat: number,
    lng: number,
    categoryIds: string[],
    options?: { radius?: number; limit?: number },
  ): Promise<RawFoursquareVenue[]> {
    if (!categoryIds.length) return [];
    return this.search({
      lat,
      lng,
      radius: options?.radius ?? 8000,
      limit: options?.limit ?? 50,
      categories: categoryIds.join(','),
    });
  }

  private async search(params: {
    lat: number;
    lng: number;
    radius: number;
    limit: number;
    categories?: string;
  }): Promise<RawFoursquareVenue[]> {
    if (!process.env.FOURSQUARE_API_KEY?.trim()) {
      this.logger.warn('FOURSQUARE_API_KEY is not set');
      return [];
    }

    try {
      const categoryIds = params.categories
        ? params.categories.split(',').filter(Boolean)
        : [];

      return await searchFoursquarePlaces({
        lat: params.lat,
        lng: params.lng,
        radius: params.radius,
        limit: params.limit,
        categoryIds,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Foursquare search failed: ${message}`);
      return [];
    }
  }
}
