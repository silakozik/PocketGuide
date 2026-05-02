import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { RouteQueueService } from './route-queue.service';

class GenerateRouteBodyDto {
  userId: string;
  cityId: string;
  isPremium?: boolean;
  preferences: {
    startLat: number;
    startLng: number;
    interests: string[];
    maxStops?: number;
    maxDurationMinutes?: number;
    radiusMeters?: number;
  };
}

@Controller('routes')
export class RouteQueueController {
  constructor(private readonly routeQueue: RouteQueueService) {}

  /** Rate limits: Throttler (AppModule named throttlers) + Redis enqueue limit in RouteQueueService. */
  @Post('generate')
  async generate(@Body() body: GenerateRouteBodyDto) {
    if (!body?.userId?.trim()) {
      throw new BadRequestException('userId is required');
    }
    if (!body.cityId?.trim()) {
      throw new BadRequestException('cityId is required');
    }
    if (
      typeof body.preferences?.startLat !== 'number' ||
      typeof body.preferences?.startLng !== 'number' ||
      !Array.isArray(body.preferences?.interests) ||
      body.preferences.interests.length === 0
    ) {
      throw new BadRequestException(
        'preferences with startLat, startLng (numbers) and non-empty interests is required',
      );
    }

    return this.routeQueue.addRouteJob(
      body.userId.trim(),
      {
        startLat: body.preferences.startLat,
        startLng: body.preferences.startLng,
        interests: body.preferences.interests,
        maxStops: body.preferences.maxStops,
        maxDurationMinutes: body.preferences.maxDurationMinutes,
        radiusMeters: body.preferences.radiusMeters,
      },
      body.cityId.trim(),
      Boolean(body.isPremium),
    );
  }

  @Get('status/:jobId')
  async status(@Param('jobId') jobId: string) {
    const state = await this.routeQueue.getJobStatus(jobId);
    if (state === null) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    return { jobId, status: state };
  }

  @Get('result/:jobId')
  async result(@Param('jobId') jobId: string) {
    const jobStatus = await this.routeQueue.getJobStatus(jobId);
    if (jobStatus === null) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (jobStatus !== 'completed') {
      throw new HttpException(
        { jobId, message: 'Route job is not completed yet', status: jobStatus },
        HttpStatus.CONFLICT,
      );
    }

    const payload = await this.routeQueue.getCompletedResult(jobId);
    if (payload === null) {
      throw new HttpException(
        { jobId, message: 'Result expired or unavailable' },
        HttpStatus.GONE,
      );
    }

    return payload;
  }
}
