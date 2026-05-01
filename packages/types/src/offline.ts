export interface OfflineRoute {
  id: string;
  cityId: string;
  pois: string[];
  routeData: string;
  createdAt: string;
  syncedAt?: string;
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
