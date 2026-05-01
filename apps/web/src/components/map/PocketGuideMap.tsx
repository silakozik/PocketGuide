import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap, LatLngBounds } from 'leaflet';
import { useCluster } from '../../hooks/useCluster';
import { MOCK_POIS } from '../../data/mockPOIs';
import { POI } from '../../types/poi';
import { CustomMarker } from './CustomMarker';
import { ClusterMarker } from './ClusterMarker';
import { POICard } from './POICard';
import { LayerToggle, LayerState } from './LayerToggle';
import { RoutePolyline } from './RoutePolyline';
import styles from './PocketGuideMap.module.css';
import { useNetworkStatus, useOfflineStorage } from '@pocketguide/hooks';
import type { OfflinePOI } from '@pocketguide/types';

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

function MapController({ 
  setBounds, 
  setZoom 
}: { 
  setBounds: (b: LatLngBounds) => void, 
  setZoom: (z: number) => void 
}) {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    },
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });
  return null;
}

interface PocketGuideMapProps {
  categoryFilter?: string;
  searchQuery?: string;
}

export function PocketGuideMap({ categoryFilter = "all", searchQuery = "" }: PocketGuideMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(13);
  const [pois, setPois] = useState<POI[]>([]);
  
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [clusterPois, setClusterPois] = useState<POI[] | null>(null);
  const { isOnline } = useNetworkStatus();
  const { savePOIs, getPOIsByCity, saveCity, clearOldData } = useOfflineStorage();
  
  const [layers, setLayers] = useState<LayerState>({
    pins: true,
    route: false,
    heatmap: false
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

  const filteredPOIs = useMemo(() => pois.filter(poi => {
    if (categoryFilter !== "all" && poi.category !== categoryFilter) return false;
    if (searchQuery.trim().length > 0) {
      if (!poi.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  }), [pois, categoryFilter, searchQuery]);

  const { clusters, getLeaves } = useCluster(layers.pins ? filteredPOIs : [], bounds, zoom);

  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  const handleLocateInfo = () => {
    // Burada aslında tarayıcı lokasyonu alınır, mock olarak merkeze dönüyoruz
    map?.flyTo([38.6748, 39.2225], 13);
  };

  const handleLayerChange = (key: keyof LayerState, value: boolean) => {
    setLayers(prev => ({ ...prev, [key]: value }));
  };

  const handleClusterClick = (clusterId: number, count: number, lat: number, lng: number) => {
    if (map) {
      if (count <= 8) {
        const leaves = getLeaves(clusterId, count);
        const fetchedPois = leaves.map(l => l.properties as POI);
        setClusterPois(fetchedPois);
        setSelectedPOI(null);
      } else {
        map.flyTo([lat, lng], map.getZoom() + 2);
      }
    }
  };

  const handlePoiClick = (poi: POI) => {
    setSelectedPOI(poi);
    setClusterPois(null);
  };

  return (
    <div className={styles.mapWrapper}>
      <MapContainer 
        center={[38.6748, 39.2225]} 
        zoom={13} 
        className={styles.mapContainer}
        ref={setMap}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController setBounds={setBounds} setZoom={setZoom} />

        {clusters.map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates;
          const props = cluster.properties;
          const isCluster = 'cluster' in props ? props.cluster : false;

          if (isCluster) {
            const cluster_id = 'cluster_id' in props ? props.cluster_id : 0;
            const point_count = 'point_count' in props ? props.point_count : 0;
            return (
              <ClusterMarker
                key={`cluster-${cluster_id}`}
                position={[lat, lng]}
                count={point_count}
                onClick={() => handleClusterClick(cluster_id, point_count, lat, lng)}
              />
            );
          }

          const poi = props as POI;
          return (
            <CustomMarker
              key={`poi-${poi.id}`}
              position={[lat, lng]}
              category={poi.category}
              selected={selectedPOI?.id === poi.id}
              onClick={() => handlePoiClick(poi)}
            />
          );
        })}
        <RoutePolyline />
      </MapContainer>

      <LayerToggle layers={layers} onChange={handleLayerChange} />
      
      <POICard 
        poi={selectedPOI} 
        clusterPois={clusterPois}
        onClose={() => {
          setSelectedPOI(null);
          setClusterPois(null);
        }} 
        onSelectPOI={handlePoiClick}
      />

      {/* Özel Harita Kontrolleri */}
      <div className={styles.customMapControls}>
        <button type="button" className={styles.mapCtrlBtn} onClick={handleLocateInfo} title="Konumuma Git">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>
        <div className={styles.zoomGroup}>
          <button type="button" className={styles.mapCtrlBtn} onClick={handleZoomIn} title="Yakınlaştır">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M6 12h12" />
            </svg>
          </button>
          <button type="button" className={styles.mapCtrlBtn} onClick={handleZoomOut} title="Uzaklaştır">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
