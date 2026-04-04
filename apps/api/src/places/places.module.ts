import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PoisController } from './controllers/pois.controller';
import { OSMService } from './services/osm.service';
import { FoursquareService } from './services/foursquare.service';
import { GtfsService } from './services/gtfs.service';
import { GeospatialService } from './services/geospatial.service';
import { IngestionService } from './normalization/ingestion.service';

@Module({
  controllers: [PlacesController, PoisController],
  providers: [OSMService, FoursquareService, GtfsService, GeospatialService, IngestionService],
  exports: [GeospatialService],
})
export class PlacesModule {}