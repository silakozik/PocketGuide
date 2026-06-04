import { useCallback, useEffect, useMemo, useRef, useState } from "react";
/** Web ile aynı OSM karoları — react-native-maps (MapLibre paketi gerekmez) */
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";

import {
  MAP_INITIAL_LAT,
  MAP_INITIAL_LNG,
  OSM_TILE_URL,
} from "@/src/constants/osmMapStyle";
import type { POI } from "@/src/types/poi";
import { useRoute } from "@/src/context/RouteContext";
import { POIBottomSheet } from "@/src/components/map/POIBottomSheet";
import { LayerToggle } from "@/src/components/map/LayerToggle";

type PocketGuideMapProps = {
  categoryFilter?: string;
  searchQuery?: string;
  savedPoiIds?: Set<string>;
  onToggleSave?: (poi: POI) => void;
  showPins?: boolean;
  showLayerToggle?: boolean;
  forcedCenter?: { lat: number; lng: number };
  searchMarker?: { lat: number; lng: number };
  onMapCenterChange?: (lat: number, lng: number) => void;
};

export function PocketGuideMap({
  searchQuery = "",
  savedPoiIds,
  onToggleSave,
  showPins = false,
  showLayerToggle = false,
  forcedCenter,
  searchMarker,
  onMapCenterChange,
}: PocketGuideMapProps) {
  const mapRef = useRef<MapView>(null);

  const {
    routeData,
    isActive,
    activeLegIndex,
    activeStepIndex,
    draftPOIs,
    addToRouteDraft,
    removeFromRouteDraft,
  } = useRoute();

  const [region, setRegion] = useState({
    latitude: MAP_INITIAL_LAT,
    longitude: MAP_INITIAL_LNG,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [layers, setLayers] = useState({ pins: false, route: true, heatmap: false });

  const routeCoords = useMemo(() => {
    if (!routeData?.geometry?.length) return [];
    return routeData.geometry.map(([latitude, longitude]) => ({ latitude, longitude }));
  }, [routeData]);

  const flyTo = useCallback((lat: number, lng: number, delta = 0.01) => {
    const next = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 800);
  }, []);

  useEffect(() => {
    if (!forcedCenter) return;
    flyTo(forcedCenter.lat, forcedCenter.lng);
  }, [forcedCenter?.lat, forcedCenter?.lng, flyTo]);

  useEffect(() => {
    if (!isActive || !routeData) return;
    const step = routeData.legs[activeLegIndex]?.steps[activeStepIndex];
    const idx = step?.way_points?.[0];
    const point = idx != null ? routeData.geometry[idx] : null;
    if (!point) return;
    flyTo(point[0], point[1], 0.008);
  }, [activeLegIndex, activeStepIndex, routeData, isActive, flyTo]);

  useEffect(() => {
    setLayers((prev) => ({ ...prev, route: isActive }));
  }, [isActive]);

  const onRegionChange = useCallback(
    (next: typeof region) => {
      setRegion(next);
      onMapCenterChange?.(next.latitude, next.longitude);
    },
    [onMapCenterChange],
  );

  const shouldShowRoute = layers.route && isActive && routeCoords.length > 0;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        <UrlTile
          urlTemplate={OSM_TILE_URL}
          maximumZ={19}
          flipY={false}
          tileSize={256}
        />

        {shouldShowRoute && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineDashPattern={[8, 4]}
          />
        )}

        {searchMarker ? (
          <Marker
            coordinate={{ latitude: searchMarker.lat, longitude: searchMarker.lng }}
            pinColor="#E11D48"
          />
        ) : null}

        {draftPOIs.map((poi, index) => (
          <Marker
            key={`draft-${poi.id}`}
            coordinate={{
              latitude: poi.coordinate.latitude,
              longitude: poi.coordinate.longitude,
            }}
            onPress={() => {
              setSelectedPOI(poi);
              setIsSheetOpen(true);
            }}
          >
            <View style={styles.draftMarker}>
              <Text style={styles.draftMarkerText}>{index + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {showLayerToggle ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <LayerToggle layers={layers} onChange={setLayers} />
        </View>
      ) : null}

      {isSheetOpen && selectedPOI ? (
        <POIBottomSheet
          poi={selectedPOI}
          onClose={() => setIsSheetOpen(false)}
          isInDraft={(p) => draftPOIs.some((d) => d.id === p.id)}
          onToggleDraft={(p) => {
            if (draftPOIs.some((d) => d.id === p.id)) removeFromRouteDraft(p.id);
            else addToRouteDraft(p);
          }}
          isSaved={(p) => Boolean(savedPoiIds?.has(p.id))}
          onToggleSave={onToggleSave}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: "100%" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
  draftMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0F1F3D",
    borderWidth: 2,
    borderColor: "#E0B84D",
    alignItems: "center",
    justifyContent: "center",
  },
  draftMarkerText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});

export default PocketGuideMap;
