import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullmqRootModule } from './bullmq-root.module';
import { RouteQueueInfrastructureModule } from './route-queue-infrastructure.module';
import { RouteGenerationProcessor } from './route-generation.processor';
import { RouteQueueRedisEventsSubscriber } from './route-queue-redis-events.subscriber';
import { DatabaseModule } from '../../config/database.module';
import { RedisCacheModule } from '../../config/redis.module';
import { PlacesModule } from '../../places/places.module';
import { RoutesModule } from '../routes.module';
import { AIModule } from '../../ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullmqRootModule,
    RouteQueueInfrastructureModule,
    DatabaseModule,
    RedisCacheModule,
    PlacesModule,
    RoutesModule,
    AIModule,
  ],
  providers: [RouteGenerationProcessor, RouteQueueRedisEventsSubscriber],
})
export class RouteGenerationWorkerModule {}
