import { Module } from '@nestjs/common';
import { RoutesController } from './controllers/routes.controller';
import { RoutingService } from './services/routing.service';
import { GeospatialService } from '../places/services/geospatial.service';

@Module({
  controllers: [RoutesController],
  providers: [RoutingService, GeospatialService],
  exports: [RoutingService],
})
export class RoutesModule {}
