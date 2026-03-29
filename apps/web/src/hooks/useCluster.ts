import { useMemo } from 'react';
import Supercluster from 'supercluster';
import { POI } from '../types/poi';
import type { LatLngBounds } from 'leaflet';

export interface ClusterProperties {
  cluster: boolean;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string | number;
}

export type POIFeature = GeoJSON.Feature<GeoJSON.Point, POI>;
export type ClusterFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>;
export type MapFeature = POIFeature | ClusterFeature;

export function useCluster(points: POI[], bounds: LatLngBounds | null, zoom: number) {
  const supercluster = useMemo(() => {
    const sc = new Supercluster<POI, ClusterProperties>({
      radius: 60,
      maxZoom: 16,
    });

    const features: POIFeature[] = points.map((point) => ({
      type: 'Feature',
      properties: point,
      geometry: {
        type: 'Point',
        coordinates: [point.coordinate.lng, point.coordinate.lat],
      },
    }));

    sc.load(features);
    return sc;
  }, [points]);

  const clusters = useMemo(() => {
    if (!bounds) return [];
    
    const bbox: GeoJSON.BBox = [
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat,
    ];

    return supercluster.getClusters(bbox, zoom);
  }, [bounds, zoom, supercluster]);

  const getLeaves = (clusterId: number, limit: number = 20) => {
    return supercluster.getLeaves(clusterId, limit);
  };

  return { clusters, getLeaves };
}
