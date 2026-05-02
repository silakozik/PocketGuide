import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ROUTE_GENERATION_QUEUE } from './bullmq-connection.util';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ROUTE_GENERATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600, count: 800 },
        removeOnFail: { age: 86400, count: 500 },
      },
    }),
  ],
  exports: [BullModule],
})
export class RouteQueueInfrastructureModule {}
