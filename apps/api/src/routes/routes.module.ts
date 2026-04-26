import { Module } from '@nestjs/common';
import { RoutesController } from './controllers/routes.controller';
import { CitiesController } from './controllers/cities.controller';
import { AdaptationController } from './controllers/adaptation.controller';
import { RouteController } from './controllers/route.controller';
import { RoutingService } from './services/routing.service';
import { GeospatialService } from '../places/services/geospatial.service';

@Module({
  controllers: [RoutesController, RouteController, CitiesController, AdaptationController],
  providers: [RoutingService, GeospatialService],
  exports: [RoutingService],
})
export class RoutesModule {}
