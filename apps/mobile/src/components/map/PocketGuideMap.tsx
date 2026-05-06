import Mapbox from "@rnmapbox/maps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { Platform, StyleSheet, Text, View } from "react-native";

import { MOCK_POIS } from "@/src/data/mockPOIs";
import type { POI } from "@/src/types/poi";
import { useRoute } from "@/src/context/RouteContext";

import { CustomPin } from "@/src/components/map/CustomPin";
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

type PocketGuideMapProps = {
  categoryFilter?: MapCategoryFilter;
  searchQuery?: string;
  savedPoiIds?: Set<string>;
  onToggleSave?: (poi: POI) => void;
};

export function PocketGuideMap({
  categoryFilter = "all",
  searchQuery = "",
  savedPoiIds,
  onToggleSave,
}: PocketGuideMapProps) {
  const cameraRef = useRef<any>(null);
  const mapboxToken = (process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "").trim();
  const canRenderMap = mapboxToken.length > 0;
  const { routeData, isActive, activeLegIndex, activeStepIndex, draftPOIs, addToRouteDraft, removeFromRouteDraft } =
    useRoute();
  const [cameraCenter, setCameraCenter] = useState<[number, number]>([39.2214, 38.6736]);
  const [cameraZoom, setCameraZoom] = useState(12);

  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [poiList, setPoiList] = useState<POI[] | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [layers, setLayers] = useState({ pins: true, route: true, heatmap: false });
  const filteredPOIs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const mapped = categoryMap[categoryFilter];
    return MOCK_POIS.filter((poi) => {
      if (mapped !== "all" && !mapped.includes(poi.category)) return false;
      if (q && !poi.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categoryFilter, searchQuery]);
  const routeShape = useMemo(() => {
    if (!routeData?.geometry?.length) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: routeData.geometry.map(([latitude, longitude]) => [longitude, latitude]),
      },
    };
  }, [routeData]);

  useEffect(() => {
    if (!canRenderMap) {
      console.error("Mapbox token missing. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in apps/mobile/.env.");
      return;
    }
    Mapbox.setAccessToken(mapboxToken);
  }, [canRenderMap]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({});
      if (!mounted) return;

      const nextCenter: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      setCameraCenter(nextCenter);
      setCameraZoom(13.5);
      cameraRef.current?.setCamera({
        centerCoordinate: nextCenter,
        zoomLevel: 13.5,
        animationDuration: 900,
      });
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const openSheet = useCallback((poi: POI, list?: POI[]) => {
    setSelectedPOI(poi);
    setPoiList(list);
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

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

  const handlePoiPress = useCallback(
    (poi: POI) => {
      openSheet(poi);
    },
    [openSheet]
  );

  const showPins = layers.pins;
  const showRoute = layers.route && isActive && routeData;

  useEffect(() => {
    if (!showRoute || !routeData) return;
    const activeLeg = routeData.legs[activeLegIndex];
    const activeStep = activeLeg?.steps[activeStepIndex];
    if (!activeStep?.way_points?.length) return;
    const pointIndex = activeStep.way_points[0];
    const point = routeData.geometry[pointIndex];
    if (!point) return;
    const nextCenter: [number, number] = [point[1], point[0]];
    setCameraCenter(nextCenter);
    setCameraZoom(14.5);
    cameraRef.current?.setCamera({
      centerCoordinate: nextCenter,
      zoomLevel: 14.5,
      animationDuration: 900,
    });
  }, [activeLegIndex, activeStepIndex, routeData, showRoute]);

  if (!canRenderMap) {
    return (
      <View style={styles.missingKeyContainer}>
        <Text style={styles.missingKeyTitle}>Harita acilamadi</Text>
        <Text style={styles.missingKeyText}>
          Mapbox access token bulunamadi. <Text style={styles.code}>apps/mobile/.env</Text> dosyasina{" "}
          <Text style={styles.code}>EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=...</Text> ekleyip uygulamayi yeniden derleyin.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
      >
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={cameraZoom}
          centerCoordinate={cameraCenter}
          animationMode="flyTo"
          animationDuration={500}
        />
        <Mapbox.UserLocation visible={true} />

        {showRoute && routeShape ? (
          <Mapbox.ShapeSource id="active-route" shape={routeShape as any}>
            <Mapbox.LineLayer
              id="active-route-line"
              style={{
                lineColor: "#3B82F6",
                lineWidth: 5,
                lineDasharray: [2, 2],
              }}
            />
          </Mapbox.ShapeSource>
        ) : null}

        {showPins &&
          filteredPOIs.map((poi) => (
            <Mapbox.PointAnnotation
              id={`poi-${poi.id}`}
              key={`poi-${poi.id}`}
              coordinate={[poi.coordinate.longitude, poi.coordinate.latitude]}
              onSelected={() => handlePoiPress(poi)}
            >
              <CustomPin
                category={poi.category}
                selected={selectedPOI?.id === poi.id}
                onPress={() => handlePoiPress(poi)}
              />
            </Mapbox.PointAnnotation>
          ))}
      </Mapbox.MapView>

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
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
  missingKeyContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  missingKeyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  missingKeyText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
  },
  code: {
    fontFamily: "monospace",
    color: "#111827",
  },
});

