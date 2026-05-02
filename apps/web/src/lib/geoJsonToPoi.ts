import type { POI } from "../types/poi";
import type { POIGeoJsonProperties } from "./poiGeoJson";

/** Supercluster yaprağından uygulama POI nesnesine */
export function featureToPoi(
  leaf: GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>,
): POI {
  const [lng, lat] = leaf.geometry.coordinates;
  const p = leaf.properties;
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    coordinate: { lat, lng },
  };
}
