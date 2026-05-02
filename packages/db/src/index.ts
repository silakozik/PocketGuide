import Dexie, { type Table } from "dexie";
import type {
  OfflineCity,
  OfflinePOI,
  OfflineRoute,
  PendingSyncRecord,
} from "@pocketguide/types";

export class PocketGuideOfflineDb extends Dexie {
  routes!: Table<OfflineRoute, string>;
  pois!: Table<OfflinePOI, string>;
  cities!: Table<OfflineCity, string>;
  pendingSync!: Table<PendingSyncRecord, string>;

  constructor() {
    super("pocketguide_offline");

    this.version(1).stores({
      routes: "id, cityId, createdAt, [cityId+createdAt]",
      pois: "id, cityId, category, [cityId+category]",
      cities: "id, country, lastFetched",
    });

    this.version(2).stores({
      routes: "id, cityId, createdAt, [cityId+createdAt]",
      pois: "id, cityId, category, [cityId+category]",
      cities: "id, country, lastFetched",
      pendingSync: "id, action, endpoint, createdAt, retryCount",
    });
  }
}

export const offlineDb = new PocketGuideOfflineDb();
