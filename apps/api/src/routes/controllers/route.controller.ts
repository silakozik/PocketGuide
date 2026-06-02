import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { UseRedisCache } from '../../common/decorators/redis-cache.decorator';
import { RedisCacheInterceptor } from '../../common/interceptors/redis-cache.interceptor';
import { RoutingService, OptimizedPoi, OptimizedRouteResponse } from '../services/routing.service';

/**
 * RouteController
 * 
 * Handles singular 'route' endpoints for specific journey optimizations.
 */
@Controller('route')
export class RouteController {
  constructor(private readonly routingService: RoutingService) {}

  /**
   * POST /api/route/optimize
   * 
   * Optimizes a list of POIs to find the shortest duration route.
   * Input: [{ lat, lng, poi_id, name }, ...]
   */
  /**
   * POST /api/route/directions
   * Body: { coordinates: [[lng, lat], ...] }
   */
  @Post('directions')
  async getDirections(
    @Body() body: { coordinates?: [number, number][] },
  ): Promise<Record<string, unknown>> {
    const coordinates = body?.coordinates;
    if (!coordinates || coordinates.length < 2) {
      throw new BadRequestException('En az 2 koordinat gerekli.');
    }
    try {
      return await this.routingService.fetchDrivingDirections(coordinates);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: error instanceof Error ? error.message : 'Directions request failed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('optimize')
  @UseInterceptors(RedisCacheInterceptor)
  @UseRedisCache({ ttl: 86400, keyPrefix: 'route' })
  async optimizeRoute(@Body() pois: OptimizedPoi[]): Promise<OptimizedRouteResponse> {
    try {
      return await this.routingService.optimizeRoute(pois);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: error.message || 'Route optimization failed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
