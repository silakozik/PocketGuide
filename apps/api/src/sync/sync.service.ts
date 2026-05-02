import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type {
  SyncBatchChange,
  SyncBatchResponseBody,
  OfflineRouteBundleDTO,
} from '@pocketguide/types';
import { GeospatialService } from '../places/services/geospatial.service';

function parseTs(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @Inject('DB_CONNECTION') private readonly db: any,
    private readonly geospatialService: GeospatialService,
  ) {}

  async buildOfflineBundle(
    routeCompositeId: string,
    cityId: string,
  ): Promise<OfflineRouteBundleDTO> {
    const poiIds = routeCompositeId.split('__').filter(Boolean);
    const rows =
      poiIds.length > 0
        ? await this.geospatialService.findPoisByIds(poiIds)
        : [];
    const now = new Date().toISOString();
    return {
      serverTime: now,
      pois: rows.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        cityId,
        address: p.address ?? null,
        description: p.description ?? null,
        rating: p.rating ?? null,
        updatedAt: now,
      })),
    };
  }

  async applyBatch(changes: SyncBatchChange[]): Promise<SyncBatchResponseBody> {
    const synced: SyncBatchResponseBody['synced'] = [];
    const failed: SyncBatchResponseBody['failed'] = [];
    const conflicts: SyncBatchResponseBody['conflicts'] = [];

    for (const change of changes) {
      const ref = {
        changeId: change.id,
        action: change.action,
        resource: change.resource,
      };

      try {
        if (change.resource === 'routes' && change.action === 'patch') {
          synced.push(ref);
          continue;
        }

        if (change.resource === 'pois' && change.action === 'favorite.add') {
          await this.handleFavoriteAdd(change, ref, synced, conflicts, failed);
          continue;
        }

        if (change.resource === 'pois' && change.action === 'favorite.remove') {
          await this.handleFavoriteRemove(change, ref, synced, failed, conflicts);
          continue;
        }

        failed.push({
          ...ref,
          error: `Unsupported action/resource: ${change.action} ${change.resource}`,
        });
      } catch (e) {
        this.logger.warn(`sync batch item failed ${change.id}`, e);
        failed.push({
          ...ref,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return { synced, failed, conflicts };
  }

  private async handleFavoriteAdd(
    change: SyncBatchChange,
    ref: { changeId: string; action: string; resource: string },
    synced: SyncBatchResponseBody['synced'],
    conflicts: SyncBatchResponseBody['conflicts'],
    failed: SyncBatchResponseBody['failed'],
  ): Promise<void> {
    const userId = String(change.payload.userId ?? '');
    const placeId = String(change.payload.placeId ?? change.id);
    if (!userId || !placeId) {
      failed.push({ ...ref, error: 'userId and placeId required' });
      return;
    }

    const userCheck = await this.db.execute(
      sql`SELECT id::text AS id FROM users WHERE id = ${userId}::uuid LIMIT 1`,
    );

    const uRows = userCheck.rows as { id?: string }[];
    if (!uRows?.length) {
      failed.push({
        ...ref,
        error: 'User not registered; favorites require a valid user id',
      });
      return;
    }

    const existingRes = await this.db.execute(
      sql`
        SELECT id::text AS id, "updatedAt"::text AS "updatedAt"
        FROM favorites
        WHERE "userId" = ${userId}::uuid
          AND "placeId" = ${placeId}::uuid
        LIMIT 1`,
    );

    const existingRows = existingRes.rows as {
      id: string;
      updatedAt?: string;
    }[];

    const clientTs = parseTs(change.clientTimestamp);

    if (existingRows?.length) {
      const existing = existingRows[0];
      const serverTs = parseTs(existing.updatedAt);
      if (serverTs > clientTs) {
        conflicts.push({
          ...ref,
          serverTimestamp:
            existing.updatedAt ?? new Date().toISOString(),
          reason: 'Server favorite is newer',
        });
        return;
      }
      await this.db.execute(
        sql`
          UPDATE favorites
          SET "updatedAt" = now()
          WHERE id = ${existing.id}::uuid`,
      );
      synced.push(ref);
      return;
    }

    await this.db.execute(sql`
      INSERT INTO favorites (id, "userId", "placeId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}::uuid, ${placeId}::uuid, now(), now())`);
    synced.push(ref);
  }

  private async handleFavoriteRemove(
    change: SyncBatchChange,
    ref: { changeId: string; action: string; resource: string },
    synced: SyncBatchResponseBody['synced'],
    failed: SyncBatchResponseBody['failed'],
    conflicts: SyncBatchResponseBody['conflicts'],
  ): Promise<void> {
    const userId = String(change.payload.userId ?? '');
    const placeId = String(change.payload.placeId ?? change.id);
    if (!userId || !placeId) {
      failed.push({ ...ref, error: 'userId and placeId required' });
      return;
    }

    const existingRes = await this.db.execute(
      sql`
        SELECT id::text AS id, "updatedAt"::text AS "updatedAt"
        FROM favorites
        WHERE "userId" = ${userId}::uuid
          AND "placeId" = ${placeId}::uuid
        LIMIT 1`,
    );

    const existingRows = existingRes.rows as {
      id: string;
      updatedAt?: string;
    }[];
    const clientTs = parseTs(change.clientTimestamp);

    if (existingRows?.length) {
      const existing = existingRows[0];
      const serverTs = parseTs(existing.updatedAt);
      if (serverTs > clientTs) {
        conflicts.push({
          ...ref,
          serverTimestamp:
            existing.updatedAt ?? new Date().toISOString(),
          reason: 'Server record is newer; remove skipped',
        });
        return;
      }
      await this.db.execute(
        sql`DELETE FROM favorites WHERE id = ${existing.id}::uuid`,
      );
    }
    synced.push(ref);
  }
}
