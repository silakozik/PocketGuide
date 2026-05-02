import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

import { useNetworkStatus, useOfflineStorage } from "@pocketguide/hooks";
import type { OfflinePOI } from "@pocketguide/types";

import { poiMatchesUiMapFilter } from "../../constants/uiCategoryFilters";
import { useMarkerCluster } from "../../hooks/useMarkerCluster";
import { featureToPoi } from "../../lib/geoJsonToPoi";
import { poisToGeoJsonFeatures } from "../../lib/poiGeoJson";
import type { POIGeoJsonProperties } from "../../lib/poiGeoJson";
import { MOCK_POIS } from "../../data/mockPOIs";
import { POI } from "../../types/poi";
import type { LayerState } from "./LayerToggle";
import { LayerToggle } from "./LayerToggle";
import { POICard } from "./POICard";
import styles from "./PocketGuideMap.module.css";
import { MapView } from "./MapView";

const DEFAULT_CITY_ID = "elazig";

async function fetchPoisFromApi(cityId: string): Promise<POI[]> {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!apiBase) {
    return MOCK_POIS;
  }

  const response = await fetch(`${apiBase}/cities/${cityId}/pois`);
  if (!response.ok) {
    throw new Error(`Failed to fetch POIs: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("POI payload is not an array");
  }

  return payload as POI[];
}

function toOfflinePoi(poi: POI, cityId: string): OfflinePOI {
  return {
    id: poi.id,
    name: poi.name,
    category: poi.category,
    lat: poi.coordinate.lat,
    lng: poi.coordinate.lng,
    cityId,
    updatedAt: new Date().toISOString(),
  };
}

function toUiPoi(poi: OfflinePOI): POI {
  return {
    id: poi.id,
    name: poi.name,
    category: poi.category as POI["category"],
    coordinate: {
      lat: poi.lat,
      lng: poi.lng,
    },
  };
}

interface PocketGuideMapProps {
  categoryFilter?: string;
  searchQuery?: string;
}

export function PocketGuideMap({
  categoryFilter = "all",
  searchQuery = "",
}: PocketGuideMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [clusterPois, setClusterPois] = useState<POI[] | null>(null);

  const { isOnline } = useNetworkStatus();
  const { savePOIs, getPOIsByCity, saveCity, clearOldData } = useOfflineStorage();

  const [layers, setLayers] = useState<LayerState>({
    pins: true,
    route: false,
    heatmap: false,
  });

  useEffect(() => {
    let isMounted = true;

    const bootstrapPois = async () => {
      const cached = await getPOIsByCity(DEFAULT_CITY_ID);
      if (isMounted && cached.length > 0) {
        setPois(cached.map(toUiPoi));
      }

      if (!isOnline) {
        return;
      }

      try {
        const apiPois = await fetchPoisFromApi(DEFAULT_CITY_ID);
        if (!isMounted) {
          return;
        }

        setPois(apiPois);
        await savePOIs(apiPois.map((poi) => toOfflinePoi(poi, DEFAULT_CITY_ID)));
        await saveCity({
          id: DEFAULT_CITY_ID,
          name: "Elazig",
          country: "TR",
          lastFetched: new Date().toISOString(),
        });
        await clearOldData(7);
      } catch (error) {
        console.error("POI refresh failed, using cached values", error);
        if (isMounted && cached.length === 0) {
          setPois(MOCK_POIS);
        }
      }
    };

    void bootstrapPois();

    return () => {
      isMounted = false;
    };
  }, [isOnline, clearOldData, getPOIsByCity, saveCity, savePOIs]);

  const filteredPOIs = useMemo(
    () =>
      pois.filter((poi) => {
        if (!poiMatchesUiMapFilter(categoryFilter, poi.category)) return false;
        if (searchQuery.trim().length > 0) {
          if (!poi.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        }
        return true;
      }),
    [pois, categoryFilter, searchQuery],
  );

  const poiFeatures = useMemo(
    () => poisToGeoJsonFeatures(filteredPOIs),
    [filteredPOIs],
  );

  const {
    clusters,
    superclusterInstance,
    notifyViewportChanged,
    primeViewportImmediate,
  } = useMarkerCluster(layers.pins ? poiFeatures : []);

  const handleLayerChange = useCallback((key: keyof LayerState, value: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePoiMarkerClick = useCallback(
    (props: POIGeoJsonProperties) => {
      const found = filteredPOIs.find((p) => p.id === props.id);
      if (found) {
        setSelectedPOI(found);
        setClusterPois(null);
      }
    },
    [filteredPOIs],
  );

  const handleClusterMarkerClick = useCallback(
    async (clusterId: number, count: number, lng: number, lat: number) => {
      const rawMap = mapRef.current?.getMap?.();
      if (!rawMap) return;
      const map = rawMap as {
        flyTo: (opts: Record<string, unknown>) => void;
        getZoom: () => number;
      };

      if (count <= 8) {
        const leaves = await superclusterInstance.getLeaves(clusterId, count);
        setClusterPois(leaves.map(featureToPoi));
        setSelectedPOI(null);
        return;
      }

      const ez = await superclusterInstance.getClusterExpansionZoom(clusterId);
      const floor = Math.floor(ez);
      const targetZ = Math.min(Math.max(floor, map.getZoom() + 1), 20);
      map.flyTo({
        center: [lng, lat],
        zoom: targetZ,
        essential: true,
        duration: 520,
      });
    },
    [superclusterInstance],
  );

  return (
    <div className={styles.mapWrapper}>
      <MapView
        mapboxAccessToken={mapboxToken}
        mapRef={mapRef}
        clusters={clusters}
        showPinsLayer={layers.pins}
        showRouteLayer={layers.route}
        notifyViewportChanged={notifyViewportChanged}
        primeViewportImmediate={primeViewportImmediate}
        onClusterClick={handleClusterMarkerClick}
        onPoiClick={handlePoiMarkerClick}
        selectedPoiId={selectedPOI?.id ?? null}
      />

      <LayerToggle layers={layers} onChange={handleLayerChange} />

      <POICard
        poi={selectedPOI}
        clusterPois={clusterPois}
        onClose={() => {
          setSelectedPOI(null);
          setClusterPois(null);
        }}
        onSelectPOI={(p) => {
          setSelectedPOI(p);
          setClusterPois(null);
        }}
      />
    </div>
  );
}
