import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SavedTripsController } from './saved-trips.controller';

@Module({
  imports: [AuthModule],
  controllers: [SavedTripsController],
})
export class SavedTripsModule {}
