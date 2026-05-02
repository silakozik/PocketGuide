import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ROUTE_GENERATION_QUEUE } from './bullmq-connection.util';
import type { RouteGenerationJobData } from './route-generation-job.types';
import { GeminiService } from '../../ai/gemini.service';
import { GeospatialService } from '../../places/services/geospatial.service';
import { RoutingService } from '../services/routing.service';
import { RedisService } from '../../config/redis.service';

const ROUTE_JOB_NAME = 'generate';
const ROUTE_RESULT_TTL_SEC = 3600;

@Processor(ROUTE_GENERATION_QUEUE, { concurrency: 3 })
@Injectable()
export class RouteGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(RouteGenerationProcessor.name);

  constructor(
    private readonly routingService: RoutingService,
    private readonly geminiService: GeminiService,
    private readonly geospatialService: GeospatialService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<RouteGenerationJobData>): Promise<{ ok: true }> {
    if (job.name !== ROUTE_JOB_NAME) {
      this.logger.warn(`Ignoring unexpected job name ${job.name} id=${job.id}`);
      return { ok: true };
    }

    const { userId, cityId, preferences } = job.data;

    const route =
      await this.routingService.generateSmartRoute(preferences);

    const nearbyPois = await this.geospatialService.findNearby({
      lat: preferences.startLat,
      lng: preferences.startLng,
      radiusMeters: preferences.radiusMeters ?? 2000,
      limit: 20,
    });

    const recommendationUser = {
      id: userId,
      location: { lat: preferences.startLat, lng: preferences.startLng },
      interests: preferences.interests,
      budget: 'medium',
    };

    const recommendations = await this.geminiService.getRecommendations(
      recommendationUser,
      nearbyPois,
    );

    const payload = {
      cityId,
      route,
      recommendations,
    };

    await this.redisService.set(
      this.resultKey(job.id),
      payload,
      ROUTE_RESULT_TTL_SEC,
    );

    return { ok: true };
  }

  private resultKey(jobId: string | number | undefined): string {
    return `route:result:${String(jobId)}`;
  }
}
