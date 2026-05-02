import type { POI, POICategory } from "../types/poi";

/** GeoJSON point properties — Supercluster yaprak özellikleri */
export interface POIGeoJsonProperties {
  id: string;
  name: string;
  category: POICategory;
}

export type POIPointFeature = GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>;

/** POI listesinden Supercluster’a uygun Feature koleksiyonu */
export function poisToGeoJsonFeatures(poies: POI[]): POIPointFeature[] {
  return poies.map((poi) => ({
    type: "Feature",
    properties: {
      id: poi.id,
      name: poi.name,
      category: poi.category,
    },
    geometry: {
      type: "Point",
      coordinates: [poi.coordinate.lng, poi.coordinate.lat],
    },
  }));
}
