import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { OfflineSyncAuthGuard } from './guards/offline-sync-auth.guard';
import { SyncService } from './sync.service';
import type {
  SyncBatchChange,
  SyncBatchRequestBody,
} from '@pocketguide/types';

function assertBatch(body: SyncBatchRequestBody): SyncBatchChange[] {
  if (!body || typeof body !== 'object' || !Array.isArray(body.changes)) {
    throw new BadRequestException('changes array is required');
  }
  for (const ch of body.changes) {
    if (
      !ch ||
      typeof ch.id !== 'string' ||
      typeof ch.action !== 'string' ||
      typeof ch.resource !== 'string' ||
      typeof ch.clientTimestamp !== 'string' ||
      typeof ch.payload !== 'object'
    ) {
      throw new BadRequestException(
        'Each change must have id, action, resource, clientTimestamp and payload object',
      );
    }
  }
  return body.changes;
}

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('offline-bundle')
  async getOfflineBundle(
    @Query('routeId') routeId: string,
    @Query('cityId') cityId: string,
  ): Promise<{ data: Awaited<ReturnType<SyncService['buildOfflineBundle']>> }> {
    const data = await this.syncService.buildOfflineBundle(routeId ?? '', cityId ?? '');
    return { data };
  }

  @Post('batch')
  @UseGuards(OfflineSyncAuthGuard)
  async batch(@Body() body: SyncBatchRequestBody) {
    const changes = assertBatch(body);
    return this.syncService.applyBatch(changes);
  }
}
