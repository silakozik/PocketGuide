import { useEffect, useMemo } from "react";
import { Layer, Marker, Source, useMap } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";

import { useRoute } from "../../context/RouteContext";

const routeLinePaint = {
  "line-color": "#3b82f6",
  "line-width": 5,
  "line-opacity": 0.82,
} as const;

function numberedBadge(num: number, kind: "start" | "end" | "mid") {
  let bgColor = "#3b82f6";
  if (kind === "start") bgColor = "#10b981";
  if (kind === "end") bgColor = "#ef4444";
  const size = 24;

  return (
    <div
      role="presentation"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: bgColor,
        border: "2px solid white",
        color: "#fff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.22)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: "0.76rem",
      }}
    >
      {num}
    </div>
  );
}

interface RouteLayerMapboxProps {
  visible: boolean;
}

/** Rota çizgisini GeoJSON Source/Layer; durak işaretleri ayrı `Marker`. */
export function RouteLayerMapbox({ visible }: RouteLayerMapboxProps) {
  const mapRefs = useMap();
  const { isActive, routeData, activeLegIndex, activeStepIndex } = useRoute();

  const geojsonLine = useMemo(() => {
    if (!routeData?.geometry.length) return null;

    const coordinates = routeData.geometry.map(
      ([lat, lng]) => [lng, lat] satisfies [number, number],
    );

    return {
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates,
      },
      properties: {},
    };
  }, [routeData]);

  useEffect(() => {
    if (!visible || !isActive || !routeData?.geometry.length) return;

    const ref = mapRefs.current;
    const map = typeof ref?.getMap === "function"
      ? (ref.getMap() as { fitBounds: (b: unknown, o: Record<string, unknown>) => void })
      : null;
    if (!map?.fitBounds || !routeData.geometry.length) return;

    const Mb = mapboxgl as unknown as {
      LngLatBounds: new (
        southwest: [number, number],
        northeast: [number, number],
      ) => { extend: (coord: [number, number]) => void };
    };

    const pts = routeData.geometry;
    const [lat0, lng0] = pts[0];
    const bb = new Mb.LngLatBounds([lng0, lat0], [lng0, lat0]);
    for (let i = 1; i < pts.length; i += 1) {
      const [lat, lng] = pts[i];
      bb.extend([lng, lat]);
    }

    map.fitBounds(bb, { padding: 50, maxZoom: 16, duration: 600 });
  }, [visible, isActive, routeData, mapRefs]);

  useEffect(() => {
    if (!visible || !isActive || !routeData) return;
    const ref = mapRefs.current;
    const map = typeof ref?.getMap === "function"
      ? (ref.getMap() as { flyTo: (o: Record<string, unknown>) => void })
      : null;
    if (!map?.flyTo) return;

    const leg = routeData.legs[activeLegIndex];
    const step = leg?.steps[activeStepIndex];
    const idx = step?.way_points?.[0];
    if (idx === undefined || !routeData.geometry[idx]) return;

    const [lat, lng] = routeData.geometry[idx];
    map.flyTo({
      center: [lng, lat],
      zoom: 16,
      essential: true,
      duration: 900,
    });
  }, [visible, mapRefs, isActive, routeData, activeLegIndex, activeStepIndex]);

  if (!visible || !isActive || !routeData || !geojsonLine) {
    return null;
  }

  return (
    <>
      <Source id="route-line" type="geojson" data={geojsonLine}>
        <Layer
          id="route-line-layer"
          type="line"
          layout={{
            visibility: visible ? "visible" : "none",
          }}
          paint={routeLinePaint}
        />
      </Source>

      {routeData.ordered_pois.map((poi, index) => {
        const isStart = index === 0;
        const isEnd = index === routeData.ordered_pois.length - 1;
        const kind = isStart ? "start" : isEnd ? "end" : "mid";

        return (
          <Marker
            key={`route-mp-${poi.id}`}
            longitude={poi.coordinate.lng}
            latitude={poi.coordinate.lat}
            anchor="bottom"
          >
            {numberedBadge(index + 1, kind)}
          </Marker>
        );
      })}
    </>
  );
}
