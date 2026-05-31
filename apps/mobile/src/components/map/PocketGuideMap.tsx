import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { StyleSheet, View } from "react-native";

import { MOCK_POIS } from "@/src/data/mockPOIs";
import type { POI } from "@/src/types/poi";
import { useRoute } from "@/src/context/RouteContext";
import { POIBottomSheet } from "@/src/components/map/POIBottomSheet";
import { LayerToggle } from "@/src/components/map/LayerToggle";
import type { POICategory } from "@/src/types/poi";

type MapCategoryFilter = "all" | "culture" | "food" | "transit" | "accommodation";

const categoryMap: Record<MapCategoryFilter, POICategory[] | "all"> = {
  all: "all",
  culture: ["museum", "event"],
  food: ["restaurant"],
  transit: ["transport"],
  accommodation: ["hotel"],
};

// Kategori renkleri (pin rengi için)
const CATEGORY_COLORS: Record<string, string> = {
  museum: "#8b5cf6",
  event: "#e8c547",
  restaurant: "#10b981",
  transport: "#3b82f6",
  hotel: "#f59e0b",
  default: "#0f1f3d",
};

type PocketGuideMapProps = {
  categoryFilter?: MapCategoryFilter;
  searchQuery?: string;
  savedPoiIds?: Set<string>;
  onToggleSave?: (poi: POI) => void;
  showPins?: boolean;
  forcedCenter?: { lat: number; lng: number };
};

export function PocketGuideMap({
  categoryFilter = "all",
  searchQuery = "",
  savedPoiIds,
  onToggleSave,
  showPins = true,
  forcedCenter,
}: PocketGuideMapProps) {
  const mapRef = useRef<MapView>(null);

  const { routeData, isActive, activeLegIndex, activeStepIndex, draftPOIs, addToRouteDraft, removeFromRouteDraft } =
    useRoute();

  const [region, setRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [poiList, setPoiList] = useState<POI[] | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [layers, setLayers] = useState({ pins: true, route: true, heatmap: false });

  // Filtrelenmiş POI listesi
  const filteredPOIs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const mapped = categoryMap[categoryFilter];
    return MOCK_POIS.filter((poi) => {
      if (mapped !== "all" && !mapped.includes(poi.category)) return false;
      if (q && !poi.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Rota koordinatları
  const routeCoords = useMemo(() => {
    if (!routeData?.geometry?.length) return [];
    return routeData.geometry.map(([latitude, longitude]) => ({ latitude, longitude }));
  }, [routeData]);

  // GPS konum izni ve başlangıç konumu
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted || status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({});
      if (!mounted) return;
      const newRegion = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 900);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Dışarıdan gelen merkez değişikliği (MapPage'den)
  useEffect(() => {
    if (!forcedCenter) return;
    const newRegion = {
      latitude: forcedCenter.lat,
      longitude: forcedCenter.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 800);
  }, [forcedCenter]);

  // Aktif rota adımına göre haritayı kaydır
  useEffect(() => {
    if (!isActive || !routeData) return;
    const activeLeg = routeData.legs[activeLegIndex];
    const activeStep = activeLeg?.steps[activeStepIndex];
    if (!activeStep?.way_points?.length) return;
    const pointIndex = activeStep.way_points[0];
    const point = routeData.geometry[pointIndex];
    if (!point) return;
    const newRegion = {
      latitude: point[0],
      longitude: point[1],
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current?.animateToRegion(newRegion, 900);
  }, [activeLegIndex, activeStepIndex, routeData, isActive]);

  const openSheet = useCallback((poi: POI, list?: POI[]) => {
    setSelectedPOI(poi);
    setPoiList(list);
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const handleToggleDraft = useCallback(
    (poi: POI) => {
      if (draftPOIs.some((p) => p.id === poi.id)) {
        removeFromRouteDraft(poi.id);
      } else {
        addToRouteDraft(poi);
      }
    },
    [addToRouteDraft, draftPOIs, removeFromRouteDraft]
  );

  const isInDraft = useCallback((poi: POI) => draftPOIs.some((p) => p.id === poi.id), [draftPOIs]);
  const isSaved = useCallback((poi: POI) => Boolean(savedPoiIds?.has(poi.id)), [savedPoiIds]);

  const shouldShowPins = showPins && layers.pins;
  const shouldShowRoute = layers.route && isActive && routeData && routeCoords.length > 0;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* OpenStreetMap tile layer */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          tileSize={256}
        />

        {/* Rota çizgisi */}
        {shouldShowRoute && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineDashPattern={[8, 4]}
          />
        )}

        {/* POI marker'ları */}
        {shouldShowPins &&
          filteredPOIs.map((poi) => (
            <Marker
              key={poi.id}
              coordinate={{
                latitude: poi.coordinate.latitude,
                longitude: poi.coordinate.longitude,
              }}
              pinColor={CATEGORY_COLORS[poi.category] ?? CATEGORY_COLORS.default}
              onPress={() => openSheet(poi)}
            />
          ))}
      </MapView>

      <View pointerEvents="box-none" style={styles.overlay}>
        <LayerToggle layers={layers} onChange={setLayers} />
      </View>

      {isSheetOpen && selectedPOI && (
        <POIBottomSheet
          poi={selectedPOI}
          poiList={poiList}
          onClose={closeSheet}
          isInDraft={isInDraft}
          isSaved={isSaved}
          onToggleDraft={handleToggleDraft}
          onToggleSave={onToggleSave}
        />
      )}
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
});

export default PocketGuideMap;
