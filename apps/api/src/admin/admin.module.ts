import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminCityController } from './admin-city.controller';
import { AdminCacheController } from './admin-cache.controller';
import { OverpassImporter } from './services/overpassImporter';
import { CityPipeline } from './services/cityPipeline';

@Module({
  controllers: [AdminController, AdminCityController, AdminCacheController],
  providers: [OverpassImporter, CityPipeline],
})
export class AdminModule {}
