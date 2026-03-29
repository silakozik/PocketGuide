import { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap, LatLngBounds } from 'leaflet';
import { useCluster } from '../../hooks/useCluster';
import { MOCK_POIS } from '../../data/mockPOIs';
import { POI } from '../../types/poi';
import { CustomMarker } from './CustomMarker';
import { ClusterMarker } from './ClusterMarker';
import { POICard } from './POICard';
import { LayerToggle, LayerState } from './LayerToggle';
import styles from './PocketGuideMap.module.css';

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

export function PocketGuideMap() {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(13);
  
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [clusterPois, setClusterPois] = useState<POI[] | null>(null);
  
  const [layers, setLayers] = useState<LayerState>({
    pins: true,
    route: false,
    heatmap: false
  });

  const { clusters, getLeaves } = useCluster(layers.pins ? MOCK_POIS : [], bounds, zoom);

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
    </div>
  );
}
