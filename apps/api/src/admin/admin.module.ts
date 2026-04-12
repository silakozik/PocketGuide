import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminCityController } from './admin-city.controller';

@Module({
  controllers: [AdminController, AdminCityController],
})
export class AdminModule {}
