/** Web MapView.tsx OSM_STYLE — aynı tile URL (Mapbox harita token gerekmez) */
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** MapLibre / web mapStyle JSON (referans) */
export const OSM_MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

export const MAP_INITIAL_LAT = 41.0082;
export const MAP_INITIAL_LNG = 28.9784;
export const MAP_INITIAL_ZOOM = 13;
