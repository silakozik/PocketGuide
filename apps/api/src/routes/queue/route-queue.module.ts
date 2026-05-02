import { Module } from '@nestjs/common';
import { RouteQueueInfrastructureModule } from './route-queue-infrastructure.module';
import { RouteQueueService } from './route-queue.service';
import { RouteQueueController } from './route-queue.controller';
import { RoutesModule } from '../routes.module';

@Module({
  imports: [RouteQueueInfrastructureModule, RoutesModule],
  controllers: [RouteQueueController],
  providers: [RouteQueueService],
  exports: [RouteQueueService],
})
export class RouteQueueModule {}
