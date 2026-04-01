import {Controller, Get, Query} from '@nestjs/common';
import { OSMService } from './services/osm.service';
import { FoursquareService } from './services/foursquare.service';

@Controller('places')
export class PlacesController {
  constructor(
    private readonly osmService: OSMService,
    private readonly foursquareService: FoursquareService,
  ) {}

  @Get('nearby')
  async getNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const [osm, foursquare] = await Promise.all([
      this.osmService.searchNearby(Number(lat), Number(lng)),
      this.foursquareService.searchNearby(Number(lat), Number(lng)),
    ]);

    return { osm, foursquare };
  }
}