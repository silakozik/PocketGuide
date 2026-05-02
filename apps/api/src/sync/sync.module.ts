import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { OfflineSyncAuthGuard } from './guards/offline-sync-auth.guard';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [PlacesModule],
  controllers: [SyncController],
  providers: [SyncService, OfflineSyncAuthGuard],
})
export class SyncModule {}
