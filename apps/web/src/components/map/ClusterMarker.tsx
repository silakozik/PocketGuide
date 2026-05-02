import { memo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Marker } from "react-map-gl/mapbox";

import {
  CLUSTER_TIER_DIMENSIONS_PX,
  CLUSTER_TIER_FILL,
  clusterCountTier,
} from "../../constants/clusterVisuals";
import { PIN_COLORS, PIN_ICONS } from "../../constants/mapConfig";
import type {
  ClusterAggProperties,
  MarkerClusterFeature,
} from "../../hooks/useMarkerCluster";
import type { POIGeoJsonProperties } from "../../lib/poiGeoJson";
import type { POICategory } from "../../types/poi";
import styles from "./ClusterMarker.module.css";

function isClusterAgg(
  f: MarkerClusterFeature,
): f is GeoJSON.Feature<GeoJSON.Point, ClusterAggProperties> {
  const p = f.properties;
  return (
    typeof p === "object" &&
    p !== null &&
    (p as { cluster?: unknown }).cluster === true &&
    typeof (p as { cluster_id?: unknown }).cluster_id === "number"
  );
}

function safeCategory(cat: POICategory | undefined): POICategory {
  return cat ?? "event";
}

export interface ClusterMarkerProps {
  feature: MarkerClusterFeature;
  animateClusterSplit?: boolean;
  selectedPoiId: string | null;
  onClusterClick: (
    clusterId: number,
    pointCount: number,
    lng: number,
    lat: number,
  ) => void;
  onPoiClick: (properties: POIGeoJsonProperties) => void;
}

function ClusterMarkerComponent({
  feature,
  animateClusterSplit,
  selectedPoiId,
  onClusterClick,
  onPoiClick,
}: ClusterMarkerProps) {
  const [lng, lat] = feature.geometry.coordinates;

  let inner: ReactNode;

  if (isClusterAgg(feature)) {
    const tier = clusterCountTier(feature.properties.point_count);
    const px = CLUSTER_TIER_DIMENSIONS_PX[tier];
    const fill = CLUSTER_TIER_FILL[tier];
    const count =
      feature.properties.point_count >= 1000
        ? String(feature.properties.point_count_abbreviated)
        : feature.properties.point_count.toString();

    inner = (
      <button
        type="button"
        className={`${styles.clusterBubble} ${animateClusterSplit ? styles.clusterBubbleBurst : ""}`}
        style={{
          width: px,
          height: px,
          background: fill,
          fontSize: tier === "small" ? 13 : tier === "medium" ? 15 : 17,
        }}
        onClick={(ev) => {
          ev.stopPropagation();
          onClusterClick(feature.properties.cluster_id, feature.properties.point_count, lng, lat);
        }}
      >
        <span className={styles.clusterCount}>{count}</span>
      </button>
    );
  } else {
    const props = feature.properties as POIGeoJsonProperties;
    const cat = safeCategory(props.category);
    const color = PIN_COLORS[cat] ?? PIN_COLORS.event;
    const icon = PIN_ICONS[cat] ?? PIN_ICONS.event;

    inner = (
      <button
        type="button"
        className={`${styles.markerOuter} ${selectedPoiId === props.id ? styles.markerSelected : ""}`}
        style={
          {
            "--poi-marker-color": color,
          } as CSSProperties
        }
        onClick={(ev) => {
          ev.stopPropagation();
          onPoiClick(props);
        }}
      >
        <div className={styles.markerCircle}>{icon}</div>
        <div className={styles.markerArrow} />
      </button>
    );
  }

  const keyMarker = isClusterAgg(feature)
    ? `c-${feature.properties.cluster_id}`
    : `p-${(feature.properties as POIGeoJsonProperties).id}`;

  return (
    <Marker longitude={lng} latitude={lat} anchor="center">
      <div className={styles.markerRoot} data-marker-key={keyMarker}>
        {inner}
      </div>
    </Marker>
  );
}

function propsEqual(prev: ClusterMarkerProps, next: ClusterMarkerProps) {
  if (prev.animateClusterSplit !== next.animateClusterSplit) return false;
  if (prev.selectedPoiId !== next.selectedPoiId) return false;
  if (prev.onClusterClick !== next.onClusterClick || prev.onPoiClick !== next.onPoiClick) return false;

  const [plng, plat] = prev.feature.geometry.coordinates;
  const [nlng, nlat] = next.feature.geometry.coordinates;
  if (plng !== nlng || plat !== nlat) return false;

  const pa = prev.feature.properties as unknown as Record<string, unknown>;
  const nb = next.feature.properties as unknown as Record<string, unknown>;

  if ((pa.cluster === true || nb.cluster === true) && pa.cluster === true && nb.cluster === true) {
    return (
      pa.cluster_id === nb.cluster_id &&
      pa.point_count === nb.point_count
    );
  }

  const ap = prev.feature.properties as POIGeoJsonProperties;
  const bp = next.feature.properties as POIGeoJsonProperties;

  return ap.id === bp.id && ap.category === bp.category;
}

export const ClusterMarker = memo(ClusterMarkerComponent, propsEqual);
