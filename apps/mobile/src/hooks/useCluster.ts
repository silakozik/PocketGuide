import { useCallback, useMemo } from "react";
import type { Region } from "react-native-maps";
import Supercluster from "supercluster";

import type { POI } from "@/src/types/poi";

type POIClusterProperties = POI & {
  cluster?: boolean;
  cluster_id?: number;
  point_count?: number;
};

type PointGeometry = {
  type: "Point";
  // GeoJSON koordinat SIRASI MUTLAKA: [longitude, latitude]
  coordinates: [number, number];
};

type Feature = {
  type: "Feature";
  geometry: PointGeometry;
  properties: POIClusterProperties;
};

export function getLeavesFromIndex(
  index: Supercluster<POIClusterProperties>,
  clusterId: number,
  limit: number = 20
): POI[] {
  const leaves = index.getLeaves(clusterId, limit) as any[];
  return leaves.map((l) => l.properties as POI);
}

function poiToFeature(poi: POI): Feature {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [poi.coordinate.longitude, poi.coordinate.latitude],
    },
    properties: {
      ...poi,
    },
  };
}

function getBBox(region: Region): [number, number, number, number] {
  const latDelta = Math.max(Math.abs(region.latitudeDelta), 0.000001);
  const lngDelta = Math.max(Math.abs(region.longitudeDelta), 0.000001);

  const minLng = region.longitude - lngDelta / 2;
  const maxLng = region.longitude + lngDelta / 2;
  const minLat = region.latitude - latDelta / 2;
  const maxLat = region.latitude + latDelta / 2;

  // supercluster bbox sırası: [minLng, minLat, maxLng, maxLat]
  return [minLng, minLat, maxLng, maxLat];
}

function getZoom(region: Region): number {
  const latDelta = Math.max(Math.abs(region.latitudeDelta), 0.000001);
  // Basit zoom tahmini: latitudeDelta küçüldükçe zoom artar.
  const zoom = Math.log2(360 / latDelta);
  return Math.max(0, Math.min(20, zoom));
}

export function useCluster(pois: POI[], region: Region) {
  const points = useMemo(() => pois.map(poiToFeature), [pois]);

  const index = useMemo(() => {
    const idx = new Supercluster<POIClusterProperties>({
      radius: 40,
      maxZoom: 20,
    });

    // supercluster tipleri GeoJSON ile uyumlu olduğu için cast ile ilerliyoruz.
    idx.load(points as any);
    return idx;
  }, [points]);

  const bbox = useMemo(() => getBBox(region), [region]);
  const zoom = useMemo(() => getZoom(region), [region]);

  const clusters = useMemo(() => {
    const zoomInt = Math.round(zoom);
    return index.getClusters(bbox as any, zoomInt) as unknown as Feature[];
  }, [index, bbox, zoom]);

  const clusterFeatures = useMemo(
    () => clusters.filter((f) => Boolean((f.properties as any).cluster)),
    [clusters]
  );

  const poiFeatures = useMemo(
    () => clusters.filter((f) => !Boolean((f.properties as any).cluster)),
    [clusters]
  );

  const getLeaves = useCallback(
    (clusterId: number, limit: number = 20): POI[] => {
      return getLeavesFromIndex(index, clusterId, limit);
    },
    [index]
  );

  return { clusterFeatures, poiFeatures, getLeaves };
}

