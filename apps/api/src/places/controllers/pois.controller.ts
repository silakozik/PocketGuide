import { Controller, Get, Query, Param, ParseFloatPipe, DefaultValuePipe, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { UseRedisCache } from '../../common/decorators/redis-cache.decorator';
import { RedisCacheInterceptor } from '../../common/interceptors/redis-cache.interceptor';
import { GeospatialService, PoiWithDistance } from '../services/geospatial.service';

/**
 * PoisController
 * 
 * REST API endpoints for geospatial POI queries.
 * All endpoints return data optimized for map rendering and frontend consumption.
 */
@Controller('pois')
@UseInterceptors(RedisCacheInterceptor)
@UseRedisCache({ ttl: 3600, keyPrefix: 'pois' })
export class PoisController {
  constructor(private readonly geospatialService: GeospatialService) {}

  /**
   * GET /pois/nearby?lat=41.0082&lng=28.9784&radius=1500&category=restaurant&limit=50&offset=0
   * 
   * Find POIs within a radius of a given point.
   * Uses PostGIS ST_DWithin for fast index-accelerated filtering.
   */
  @Get('nearby')
  async getNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', new DefaultValuePipe(1500), ParseIntPipe) radius: number,
    @Query('category') category?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<{ data: PoiWithDistance[]; meta: { total: number; limit: number; offset: number } }> {
    const data = await this.geospatialService.findNearby({
      lat,
      lng,
      radiusMeters: radius,
      category,
      limit,
      offset,
    });

    return {
      data,
      meta: { total: data.length, limit: limit!, offset: offset! },
    };
  }

  /**
   * GET /pois/box?minLat=41.0&minLng=28.9&maxLat=41.1&maxLng=29.0
   * 
   * Find POIs within a bounding box (map viewport).
   * Optimized for drag-to-refresh map patterns.
   */
  @Get('box')
  async getInBoundingBox(
    @Query('minLat', ParseFloatPipe) minLat: number,
    @Query('minLng', ParseFloatPipe) minLng: number,
    @Query('maxLat', ParseFloatPipe) maxLat: number,
    @Query('maxLng', ParseFloatPipe) maxLng: number,
    @Query('category') category?: string,
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<{ data: PoiWithDistance[]; meta: { total: number; limit: number; offset: number } }> {
    const data = await this.geospatialService.findInBoundingBox({
      minLat,
      minLng,
      maxLat,
      maxLng,
      category,
      limit,
      offset,
    });

    return {
      data,
      meta: { total: data.length, limit: limit!, offset: offset! },
    };
  }

  /**
   * GET /pois/knn?lat=41.0082&lng=28.9784&k=10
   * 
   * Find the K nearest POIs to a given point.
   * Uses PostGIS KNN operator (<->) for maximum performance.
   */
  @Get('knn')
  async getKNearest(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('k', new DefaultValuePipe(10), ParseIntPipe) k: number,
  ): Promise<{ data: PoiWithDistance[] }> {
    const data = await this.geospatialService.findKNearest(lat, lng, k);
    return { data };
  }

  /**
   * GET /pois/clusters?minLat=41.0&minLng=28.9&maxLat=41.1&maxLng=29.0&gridSize=0.01
   * 
   * Get clustered POI data for map marker clustering.
   * Returns grid-based aggregation for efficient map rendering at lower zoom levels.
   */
  @Get('clusters')
  async getClusters(
    @Query('minLat', ParseFloatPipe) minLat: number,
    @Query('minLng', ParseFloatPipe) minLng: number,
    @Query('maxLat', ParseFloatPipe) maxLat: number,
    @Query('maxLng', ParseFloatPipe) maxLng: number,
    @Query('gridSize', new DefaultValuePipe(0.01), ParseFloatPipe) gridSize: number,
  ) {
    const data = await this.geospatialService.getClusteredPois(
      minLat, minLng, maxLat, maxLng, gridSize,
    );
    return { data };
  }

  /**
   * GET /pois/city/:slug?category=...
   * 
   * Fetch all POIs for a specific city by slug.
   */
  @Get('city/:slug')
  async getByCity(
    @Param('slug') slug: string,
    @Query('category') category?: string,
  ): Promise<{ data: PoiWithDistance[] }> {
    const data = await this.geospatialService.findByCitySlug(slug, category);
    return { data };
  }
}
