import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useRef, useState } from "react";
import MapGL from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";

import type { MarkerClusterFeature } from "../../hooks/useMarkerCluster";
import type { POIGeoJsonProperties } from "../../lib/poiGeoJson";

import { ClusterMarker } from "./ClusterMarker";
import styles from "./PocketGuideMap.module.css";
import { RouteLayerMapbox } from "./RouteLayerMapbox";

export const MAP_INITIAL_LNG = 39.2225;
export const MAP_INITIAL_LAT = 38.6748;
export const MAP_INITIAL_ZOOM = 13;

/** OpenStreetMap tile stili — token gerektirmez */
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
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

export interface MapViewProps {
  mapRef: React.RefObject<MapRef | null>;
  clusters: MarkerClusterFeature[];
  showPinsLayer: boolean;
  showRouteLayer: boolean;
  notifyViewportChanged: (bbox: GeoJSON.BBox, zoom: number) => void;
  primeViewportImmediate: (bbox: GeoJSON.BBox, zoom: number) => void;
  onClusterClick: (
    clusterId: number,
    pointCount: number,
    lng: number,
    lat: number,
  ) => void;
  onPoiClick: (props: POIGeoJsonProperties) => void;
  selectedPoiId: string | null;
}

export function MapView({
  mapRef,
  clusters,
  showPinsLayer,
  showRouteLayer,
  notifyViewportChanged,
  primeViewportImmediate,
  onClusterClick,
  onPoiClick,
  selectedPoiId,
}: MapViewProps) {
  const lastZoomRef = useRef<number>(MAP_INITIAL_ZOOM);
  const burstTimerRef = useRef<number | undefined>(undefined);
  const [animateClusterBurst, setAnimateClusterBurst] = useState(false);

  const handleMapMovement = useCallback(() => {
    const wrap = mapRef.current;
    if (!wrap?.getMap) return;
    const map = wrap.getMap() as {
      getBounds: () => {
        getWest: () => number;
        getSouth: () => number;
        getEast: () => number;
        getNorth: () => number;
      };
      getZoom: () => number;
    };
    if (!map?.getBounds) return;

    const z = map.getZoom();

    if (z > lastZoomRef.current + 0.42) {
      setAnimateClusterBurst(true);
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
      burstTimerRef.current = window.setTimeout(() => setAnimateClusterBurst(false), 450);
    }
    lastZoomRef.current = z;

    const bb = map.getBounds();
    notifyViewportChanged(
      [
        bb.getWest(),
        bb.getSouth(),
        bb.getEast(),
        bb.getNorth(),
      ],
      z,
    );
  }, [mapRef, notifyViewportChanged]);

  return (
    <MapGL
      ref={mapRef}
      reuseMaps
      mapStyle={OSM_STYLE}
      initialViewState={{
        longitude: MAP_INITIAL_LNG,
        latitude: MAP_INITIAL_LAT,
        zoom: MAP_INITIAL_ZOOM,
      }}
      attributionControl={true}
      onLoad={() => {
        const map = mapRef.current?.getMap?.() as {
          getBounds: () => {
            getWest: () => number;
            getSouth: () => number;
            getEast: () => number;
            getNorth: () => number;
          };
          getZoom: () => number;
        };
        if (!map?.getBounds) return;

        lastZoomRef.current = map.getZoom();

        const bb = map.getBounds();
        primeViewportImmediate(
          [
            bb.getWest(),
            bb.getSouth(),
            bb.getEast(),
            bb.getNorth(),
          ],
          map.getZoom(),
        );
      }}
      onMove={() => handleMapMovement()}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <RouteLayerMapbox visible={showRouteLayer} />

      {showPinsLayer &&
        clusters.map((f) => {
          const props = f.properties as unknown as Record<string, unknown>;
          const pk =
            props.cluster === true && typeof props.cluster_id === "number"
              ? `c-${props.cluster_id as number}`
              : `p-${(props as unknown as POIGeoJsonProperties).id}`;
          return (
            <ClusterMarker
              key={pk}
              feature={f}
              animateClusterSplit={animateClusterBurst}
              selectedPoiId={selectedPoiId}
              onClusterClick={onClusterClick}
              onPoiClick={onPoiClick}
            />
          );
        })}

      <div className={styles.customMapControls}>
        <button
          type="button"
          className={styles.mapCtrlBtn}
          onClick={() => {
            (mapRef.current?.getMap?.() as { flyTo: (opts: Record<string, unknown>) => void } | undefined)?.flyTo(
              {
              center: [MAP_INITIAL_LNG, MAP_INITIAL_LAT],
              zoom: MAP_INITIAL_ZOOM,
              essential: true,
              duration: 900,
              },
            );
          }}
          title="Konuma git"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>
        <div className={styles.zoomGroup}>
          <button
            type="button"
            className={styles.mapCtrlBtn}
            onClick={() =>
              (mapRef.current?.getMap?.() as { zoomIn: (o: Record<string, unknown>) => void } | undefined)?.zoomIn({
                duration: 220,
              })
            }
            title="Yakinlastir"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.mapCtrlBtn}
            onClick={() =>
              (mapRef.current?.getMap?.() as { zoomOut: (o: Record<string, unknown>) => void } | undefined)?.zoomOut({
                duration: 220,
              })
            }
            title="Uzaklastir"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
            </svg>
          </button>
        </div>
      </div>
    </MapGL>
  );
}

