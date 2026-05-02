import {
  Injectable,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ROUTE_GENERATION_QUEUE } from './bullmq-connection.util';
import type { RouteGenerationJobData } from './route-generation-job.types';
import { RedisService } from '../../config/redis.service';
import type { SmartRouteRequest } from '../services/routing.service';

const MAX_ROUTE_QUEUE_BACKLOG = 100;
const USER_ENQUEUE_RATE_WINDOW_SEC = 60;
const USER_ENQUEUE_RATE_MAX = 3;

export type RouteEnqueueResponse = {
  jobId: string;
  /** 1-based place in waiting (or delayed) line; `0` if already active. */
  position: number;
};

export type RouteJobStatus =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed';

@Injectable()
export class RouteQueueService {
  constructor(
    @InjectQueue(ROUTE_GENERATION_QUEUE) private readonly routeQueue: Queue,
    private readonly redisService: RedisService,
  ) {}

  routeResultKey(jobId: string): string {
    return `route:result:${jobId}`;
  }

  enqueueRateRedisKey(userId: string): string {
    return `route:enqueue:rl:user:${userId}`;
  }

  async addRouteJob(
    userId: string,
    preferences: SmartRouteRequest,
    cityId: string,
    isPremium = false,
  ): Promise<RouteEnqueueResponse> {
    if (!cityId?.trim()) {
      throw new HttpException('cityId is required', HttpStatus.BAD_REQUEST);
    }
    if (
      preferences.startLat === undefined ||
      preferences.startLng === undefined ||
      !preferences.interests?.length
    ) {
      throw new HttpException(
        'preferences.startLat, startLng and interests are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const counts = await this.routeQueue.getJobCounts(
      'waiting',
      'delayed',
      'active',
    );

    const backlog = counts.waiting + counts.delayed + counts.active;

    if (backlog > MAX_ROUTE_QUEUE_BACKLOG) {
      throw new HttpException(
        { message: 'Route queue backlog limit exceeded', limit: MAX_ROUTE_QUEUE_BACKLOG },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rlCount = await this.redisService.incrCounterWithTtl(
      this.enqueueRateRedisKey(userId),
      USER_ENQUEUE_RATE_WINDOW_SEC,
    );
    if (rlCount === null) {
      throw new ServiceUnavailableException(
        'Redis is required to enqueue route jobs',
      );
    }
    if (rlCount > USER_ENQUEUE_RATE_MAX) {
      throw new HttpException(
        { message: 'Too many enqueue requests per user', limit: USER_ENQUEUE_RATE_MAX, windowSeconds: USER_ENQUEUE_RATE_WINDOW_SEC },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const data: RouteGenerationJobData = {
      userId,
      cityId: cityId.trim(),
      isPremium,
      preferences,
    };

    const priority = isPremium ? 1 : 5;

    const job = await this.routeQueue.add('generate', data, { priority });

    const jobId = String(job.id);
    const waiting = await this.routeQueue.getWaiting(0, 500);
    const posWaiting = waiting.findIndex((j) => j.id === job.id);

    if (posWaiting >= 0) {
      return { jobId, position: posWaiting + 1 };
    }

    const delayed = await this.routeQueue.getDelayed(0, 500);
    const posDelayed = delayed.findIndex((j) => j.id === job.id);
    if (posDelayed >= 0) {
      return { jobId, position: waiting.length + posDelayed + 1 };
    }

    const state = await job.getState();
    if (state === 'active') {
      return { jobId, position: 0 };
    }

    return { jobId, position: Math.max(backlog + 1, 1) };
  }

  async getJobStatus(jobId: string): Promise<RouteJobStatus | null> {
    const job = await this.routeQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    if (state === 'waiting' || state === 'prioritized' || state === 'waiting-children')
      return 'waiting';
    if (state === 'active') return 'active';
    if (state === 'completed') return 'completed';
    if (state === 'failed') return 'failed';
    if (state === 'delayed') return 'delayed';

    return 'waiting';
  }

  async getCompletedResult(jobId: string): Promise<unknown | null> {
    return this.redisService.get<unknown>(this.routeResultKey(jobId));
  }
}
