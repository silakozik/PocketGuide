import { Controller, Get, Query, ParseFloatPipe, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { RoutingService, SmartRouteResult } from '../services/routing.service';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routingService: RoutingService) {}

  /**
   * GET /routes/smart?lat=41.0082&lng=28.9784&interests=restaurant,attraction,cafe&maxStops=6&maxDuration=480&radius=5000
   * 
   * Generate an AI-ready optimized multi-stop route based on user interests.
   */
  @Get('smart')
  async getSmartRoute(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('interests') interests: string,
    @Query('maxStops', new DefaultValuePipe(6), ParseIntPipe) maxStops: number,
    @Query('maxDuration', new DefaultValuePipe(480), ParseIntPipe) maxDuration: number,
    @Query('radius', new DefaultValuePipe(5000), ParseIntPipe) radius: number,
  ): Promise<{ data: SmartRouteResult; aiContext: string }> {
    const interestList = interests
      ? interests.split(',').map((s) => s.trim())
      : ['attraction', 'restaurant'];

    const route = await this.routingService.generateSmartRoute({
      startLat: lat,
      startLng: lng,
      interests: interestList,
      maxStops,
      maxDurationMinutes: maxDuration,
      radiusMeters: radius,
    });

    return {
      data: route,
      aiContext: this.routingService.formatForAIContext(route),
    };
  }
}
