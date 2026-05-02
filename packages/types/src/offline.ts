export interface OfflineRoute {
  id: string;
  cityId: string;
  pois: string[];
  routeData: string;
  createdAt: string;
  syncedAt?: string;
  /** Sunucudan hydrate edilmiş ve offline kullanıma işaretlenmiş rota */
  offlineReady?: boolean;
  /** Harita karo ön yükleme / viewport için bbox (WGS84) */
  tileBounds?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  serverHydratedAt?: string;
}

export interface PendingSyncRecord {
  id: string;
  action: string;
  endpoint: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

export interface OfflinePOI {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  cityId: string;
  updatedAt?: string;
}

export interface OfflineCity {
  id: string;
  name: string;
  country: string;
  lastFetched: string;
}
