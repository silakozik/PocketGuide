import { Controller, Post, Body, HttpException, HttpStatus, UseInterceptors } from '@nestjs/common';
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
