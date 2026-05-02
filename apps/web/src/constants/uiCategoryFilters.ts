import type { POICategory } from "../types/poi";

/** Map UI filter chip id → gerçek POI kategori alanları */
export const MAP_UI_CATEGORY_TO_POI: Record<
  string,
  readonly POICategory[] | null
> = {
  all: null,
  culture: ["museum", "event", "park"],
  food: ["restaurant"],
  transit: ["transport"],
  accommodation: ["hotel"],
};

/** MapPage’den gelen `categoryFilter` değeri bu POI’yi kapsıyor mu? */
export function poiMatchesUiMapFilter(uiFilter: string, category: POICategory): boolean {
  if (uiFilter === "all") return true;
  const cats = MAP_UI_CATEGORY_TO_POI[uiFilter];
  if (!cats) return true;
  return cats.includes(category);
}
