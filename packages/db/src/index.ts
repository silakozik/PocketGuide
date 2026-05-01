import Dexie, { type Table } from "dexie";
import type { OfflineCity, OfflinePOI, OfflineRoute } from "@pocketguide/types";

export class PocketGuideOfflineDb extends Dexie {
  routes!: Table<OfflineRoute, string>;
  pois!: Table<OfflinePOI, string>;
  cities!: Table<OfflineCity, string>;

  constructor() {
    super("pocketguide_offline");

    this.version(1).stores({
      routes: "id, cityId, createdAt, [cityId+createdAt]",
      pois: "id, cityId, category, [cityId+category]",
      cities: "id, country, lastFetched",
    });
  }
}

export const offlineDb = new PocketGuideOfflineDb();
