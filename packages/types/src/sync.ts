export interface SyncBatchChange {
  action: string;
  resource: string;
  id: string;
  payload: Record<string, unknown>;
  clientTimestamp: string;
}

export interface SyncBatchRequestBody {
  changes: SyncBatchChange[];
}

export interface SyncBatchResultItem {
  changeId: string;
  action: string;
  resource: string;
}

export interface SyncBatchConflictItem extends SyncBatchResultItem {
  serverTimestamp: string;
  reason?: string;
}

export interface SyncBatchFailureItem extends SyncBatchResultItem {
  error: string;
}

export interface SyncBatchResponseBody {
  synced: SyncBatchResultItem[];
  failed: SyncBatchFailureItem[];
  conflicts: SyncBatchConflictItem[];
}

export interface OfflineRouteBundleDTO {
  pois: Array<{
    id: string;
    name: string;
    category: string;
    lat: number;
    lng: number;
    cityId?: string | null;
    address?: string | null;
    description?: string | null;
    rating?: number | null;
    updatedAt?: string;
  }>;
  serverTime: string;
}
