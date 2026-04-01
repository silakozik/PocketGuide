import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { OSMService } from './services/osm.service';
import { FoursquareService } from './services/foursquare.service';
import { GtfsService } from './services/gtfs.service';

@Module({
  controllers: [PlacesController],
  providers: [OSMService, FoursquareService, GtfsService],
})
export class PlacesModule {}