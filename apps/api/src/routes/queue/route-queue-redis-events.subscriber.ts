import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueEvents } from 'bullmq';
import { createRawBullMqRedis, ROUTE_GENERATION_QUEUE } from './bullmq-connection.util';

/**
 * Logs BullMQ QueueEvents (`completed`, `failed`, `stalled`) separately from Worker logs.
 */
@Injectable()
export class RouteQueueRedisEventsSubscriber
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RouteQueueRedisEventsSubscriber.name);
  private events: QueueEvents | undefined;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const connection = createRawBullMqRedis(this.configService);
    if (!connection) {
      throw new Error('REDIS_URL is required for route queue subscriptions');
    }
    this.events = new QueueEvents(ROUTE_GENERATION_QUEUE, {
      connection,
    });

    this.events.on(
      'completed',
      ({
        jobId,
        returnvalue,
      }: {
        jobId: string;
        returnvalue?: string;
      }) =>
        this.logger.log(
          `[QueueEvents completed] jobId=${jobId} return=${returnvalue ?? 'n/a'}`,
        ),
    );
    this.events.on(
      'failed',
      ({
        jobId,
        failedReason,
      }: {
        jobId: string;
        failedReason?: string;
      }) =>
        this.logger.warn(
          `[QueueEvents failed] jobId=${jobId} reason=${failedReason ?? 'unknown'}`,
        ),
    );
    this.events.on('stalled', ({ jobId }: { jobId: string }) =>
      this.logger.warn(`[QueueEvents stalled] jobId=${jobId}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.events?.close();
    this.events = undefined;
  }
}
