export const MARKER_CLUSTER_DEBOUNCE_MS = 300;

/** Bu eşik ve üzeri noktalarda küme hesabı Web Worker'da yapılır. */
export const MARKER_CLUSTER_WORKER_THRESHOLD = 5000;

/** Mobil / düşük güç için ekranda en fazla bu kadar küme/tekil marker DOM'da kalır. */
export const MAX_MARKER_CLUSTER_RENDER = 200;

/** Supercluster parametreleri (Mapbox’un önerdiği yaklaşımla uyumlu). */
export const SUPERCLUSTER_CLUSTER_OPTIONS = {
  radius: 60,
  maxZoom: 16,
} as const;

function markerRenderScore(f: GeoJSON.Feature<GeoJSON.Point, unknown>): number {
  const p = f.properties as { cluster?: boolean; point_count?: number } | null;
  if (p?.cluster === true && typeof p.point_count === "number") {
    return p.point_count;
  }
  return 1;
}

/** Önce yüksek yoğunluklu kümeleri tutar; DOM’da en fazla `max` marker bırakır. */
export function prioritizeAndCapMarkers<T extends GeoJSON.Feature<GeoJSON.Point, unknown>>(
  features: T[],
  max: number = MAX_MARKER_CLUSTER_RENDER,
): T[] {
  if (features.length <= max) return features;
  return [...features]
    .sort((a, b) => markerRenderScore(b) - markerRenderScore(a))
    .slice(0, max);
}
