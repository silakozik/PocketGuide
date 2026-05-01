import { offlineDb } from "@pocketguide/db";
import type { OfflineCity, OfflinePOI, OfflineRoute } from "@pocketguide/types";

export function useOfflineStorage() {
  const saveRoute = async (route: OfflineRoute): Promise<boolean> => {
    try {
      await offlineDb.routes.put(route);
      return true;
    } catch (error) {
      console.error("Failed to save route into IndexedDB", error);
      return false;
    }
  };

  const getRoute = async (id: string): Promise<OfflineRoute | null> => {
    try {
      const route = await offlineDb.routes.get(id);
      return route ?? null;
    } catch (error) {
      console.error("Failed to read route from IndexedDB", error);
      return null;
    }
  };

  const savePOIs = async (pois: OfflinePOI[]): Promise<boolean> => {
    try {
      await offlineDb.pois.bulkPut(pois);
      return true;
    } catch (error) {
      console.error("Failed to save POIs into IndexedDB", error);
      return false;
    }
  };

  const getPOIsByCity = async (cityId: string): Promise<OfflinePOI[]> => {
    try {
      return await offlineDb.pois.where("cityId").equals(cityId).toArray();
    } catch (error) {
      console.error("Failed to read POIs from IndexedDB", error);
      return [];
    }
  };

  const saveCity = async (city: OfflineCity): Promise<boolean> => {
    try {
      await offlineDb.cities.put(city);
      return true;
    } catch (error) {
      console.error("Failed to save city into IndexedDB", error);
      return false;
    }
  };

  const getCity = async (id: string): Promise<OfflineCity | null> => {
    try {
      const city = await offlineDb.cities.get(id);
      return city ?? null;
    } catch (error) {
      console.error("Failed to read city from IndexedDB", error);
      return null;
    }
  };

  const clearOldData = async (days = 7): Promise<number> => {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const oldRouteIds = await offlineDb.routes
        .where("createdAt")
        .below(cutoffDate)
        .primaryKeys();

      const oldCityIds = await offlineDb.cities
        .where("lastFetched")
        .below(cutoffDate)
        .primaryKeys();

      await offlineDb.routes.bulkDelete(oldRouteIds);
      await offlineDb.cities.bulkDelete(oldCityIds);

      return oldRouteIds.length + oldCityIds.length;
    } catch (error) {
      console.error("Failed to clear old IndexedDB data", error);
      return 0;
    }
  };

  return {
    saveRoute,
    getRoute,
    savePOIs,
    getPOIsByCity,
    saveCity,
    getCity,
    clearOldData,
  };
}
