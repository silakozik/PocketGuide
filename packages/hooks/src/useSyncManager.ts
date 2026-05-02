import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { offlineDb } from "@pocketguide/db";
import type {
  OfflinePOI,
  OfflineRoute,
  PendingSyncRecord,
  SyncBatchRequestBody,
  SyncBatchResponseBody,
} from "@pocketguide/types";
import { useNetworkStatus } from "./useNetworkStatus";

const MAX_RETRY = 3;

export interface UseSyncManagerOptions {
  apiBaseUrl: string;
  getAuthHeaders: () => Record<string, string>;
}

function boundsFromGeometry(geometry: [number, number][] | undefined): {
  south: number;
  west: number;
  north: number;
  east: number;
} | undefined {
  if (!geometry?.length) return undefined;
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const [lat, lng] of geometry) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  }
  const pad = 0.02;
  return {
    south: south - pad,
    north: north + pad,
    west: west - pad,
    east: east + pad,
  };
}

function routeGeometryFromJson(
  routeDataJson: string,
): [number, number][] | undefined {
  try {
    const parsed = JSON.parse(routeDataJson) as {
      geometry?: [number, number][];
    };
    return parsed.geometry;
  } catch {
    return undefined;
  }
}

function resourceFromPending(p: PendingSyncRecord): string {
  const r = p.payload?.resource;
  if (typeof r === "string" && r.length > 0) return r;
  if (p.action.includes("favorite")) return "pois";
  if (p.action.includes("route")) return "routes";
  return "pois";
}

type BundlePoiRow = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  cityId?: string | null;
  updatedAt?: string;
};

export interface UseSyncManagerResult {
  downloadProgress: number;
  downloadError: string | null;
  isDownloading: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  deadLetterPending: PendingSyncRecord[];
  downloadRouteForOffline: (routeId: string, cityId: string) => Promise<void>;
  syncPendingChanges: () => Promise<void>;
  enqueuePendingChange: (record: Omit<PendingSyncRecord, "retryCount">) => Promise<void>;
  refreshDeadLetters: () => Promise<void>;
}

export function useSyncManager(
  options: UseSyncManagerOptions,
): UseSyncManagerResult {
  const optsRef = useRef(options);
  optsRef.current = options;

  const { isOnline } = useNetworkStatus();
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [deadLetterPending, setDeadLetterPending] = useState<PendingSyncRecord[]>([]);

  const base = useMemo(
    () => options.apiBaseUrl.replace(/\/$/, ""),
    [options.apiBaseUrl],
  );

  const refreshDeadLetters = useCallback(async () => {
    const all = await offlineDb.pendingSync.toArray();
    setDeadLetterPending(all.filter((p) => p.retryCount > MAX_RETRY));
  }, []);

  useEffect(() => {
    void refreshDeadLetters();
  }, [refreshDeadLetters]);

  const downloadRouteForOffline = useCallback(
    async (routeId: string, cityId: string) => {
      setDownloadError(null);
      setIsDownloading(true);
      setDownloadProgress(0);
      try {
        const local = await offlineDb.routes.get(routeId);
        if (!local) {
          throw new Error(
            "Rota IndexedDB'de bulunamadı. Önce rotayı çevrimiçi oluşturun.",
          );
        }
        setDownloadProgress(15);

        const url = `${base}/sync/offline-bundle?routeId=${encodeURIComponent(routeId)}&cityId=${encodeURIComponent(cityId)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Sunucu ${res.status}: offline bundle alınamadı`);
        }
        const json = (await res.json()) as {
          data: { pois: BundlePoiRow[]; serverTime: string };
        };
        setDownloadProgress(45);

        const pois: OfflinePOI[] = (json.data?.pois ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          lat: p.lat,
          lng: p.lng,
          cityId: p.cityId ?? cityId,
          updatedAt: p.updatedAt,
        }));
        await offlineDb.pois.bulkPut(pois);
        setDownloadProgress(70);

        const geometry = routeGeometryFromJson(local.routeData);
        const tileBounds =
          boundsFromGeometry(geometry) ?? local.tileBounds;

        const updated: OfflineRoute = {
          ...local,
          offlineReady: true,
          tileBounds,
          serverHydratedAt: json.data?.serverTime ?? new Date().toISOString(),
        };
        await offlineDb.routes.put(updated);
        setDownloadProgress(100);
      } catch (e) {
        setDownloadError(e instanceof Error ? e.message : String(e));
        throw e;
      } finally {
        setIsDownloading(false);
      }
    },
    [base],
  );

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline) return;
    const pending = await offlineDb.pendingSync.toArray();
    const eligible = pending.filter((p) => p.retryCount <= MAX_RETRY);
    if (!eligible.length) {
      await refreshDeadLetters();
      return;
    }

    setIsSyncing(true);
    setLastSyncError(null);
    try {
      const body: SyncBatchRequestBody = {
        changes: eligible.map((p) => ({
          id: p.id,
          action: p.action,
          resource: resourceFromPending(p),
          payload: { ...p.payload },
          clientTimestamp: p.createdAt,
        })),
      };

      const res = await fetch(`${base}/sync/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...optsRef.current.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setLastSyncError(`Sync batch failed: ${res.status}`);
        for (const p of eligible) {
          await offlineDb.pendingSync.update(p.id, {
            retryCount: p.retryCount + 1,
          });
        }
        await refreshDeadLetters();
        return;
      }

      const result = (await res.json()) as SyncBatchResponseBody;

      const syncedIds = new Set(result.synced.map((s) => s.changeId));
      const conflictIds = new Set(result.conflicts.map((c) => c.changeId));

      for (const id of syncedIds) await offlineDb.pendingSync.delete(id);
      for (const id of conflictIds) await offlineDb.pendingSync.delete(id);

      const failedIds = new Set(result.failed.map((f) => f.changeId));
      for (const p of eligible) {
        if (failedIds.has(p.id)) {
          await offlineDb.pendingSync.update(p.id, {
            retryCount: p.retryCount + 1,
          });
        }
      }

      await refreshDeadLetters();
    } catch (e) {
      setLastSyncError(e instanceof Error ? e.message : String(e));
      for (const p of eligible) {
        await offlineDb.pendingSync.update(p.id, {
          retryCount: p.retryCount + 1,
        });
      }
      await refreshDeadLetters();
    } finally {
      setIsSyncing(false);
    }
  }, [base, isOnline, refreshDeadLetters]);

  const enqueuePendingChange = useCallback(
    async (record: Omit<PendingSyncRecord, "retryCount">) => {
      const row: PendingSyncRecord = { ...record, retryCount: 0 };
      await offlineDb.pendingSync.put(row);
      await refreshDeadLetters();
    },
    [refreshDeadLetters],
  );

  const syncRef = useRef(syncPendingChanges);
  syncRef.current = syncPendingChanges;

  useEffect(() => {
    if (!isOnline) return;
    void syncRef.current();
  }, [isOnline]);

  return {
    downloadProgress,
    downloadError,
    isDownloading,
    isSyncing,
    lastSyncError,
    deadLetterPending,
    downloadRouteForOffline,
    syncPendingChanges,
    enqueuePendingChange,
    refreshDeadLetters,
  };
}
