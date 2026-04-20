import { Controller, Get, Query, Logger, ParseFloatPipe } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeospatialService } from '../places/services/geospatial.service';

/**
 * AIController
 * 
 * Exposes AI-powered features to the frontend.
 */
@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly geospatialService: GeospatialService,
  ) {}

  /**
   * GET /ai/recommendations
   * 
   * Provides personalized place recommendations for a given location.
   */
  @Get('recommendations')
  async getRecommendations(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ): Promise<any> {
    this.logger.log(`GET /ai/recommendations - Lat: ${lat}, Lng: ${lng}`);

    try {
      // 1. Get real nearby POIs from PostGIS
      const nearbyPois = await this.geospatialService.findNearby({
        lat,
        lng,
        radiusMeters: 2000,
        limit: 15,
      });

      // 2. Use user context (mocked as requested)
      const mockUser = {
        id: 'mock-user-123',
        location: { lat, lng },
        interests: ['Culture', 'History', 'Gastronomy', 'Walking'],
        budget: 'medium',
      };

      // 3. Request logic from GeminiService
      return await this.geminiService.getRecommendations(mockUser, nearbyPois);
    } catch (error) {
      this.logger.error('Failed to get AI recommendations', error);
      return { 
        error: 'AI service unavailable', 
        message: error.message 
      };
    }
  }
}
