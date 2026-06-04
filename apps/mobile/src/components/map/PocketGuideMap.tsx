import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import { MAP_INITIAL_LAT, MAP_INITIAL_LNG } from "@/src/constants/osmMapStyle";
import type { POI } from "@/src/types/poi";
import { useRoute } from "@/src/context/RouteContext";
import { POIBottomSheet } from "@/src/components/map/POIBottomSheet";
import { LayerToggle } from "@/src/components/map/LayerToggle";

const buildMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lng}], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    document.addEventListener('message', function(e) {
      var data = JSON.parse(e.data);
      if (data.type === 'flyTo') {
        map.flyTo([data.lat, data.lng], 14);
      }
      if (data.type === 'addMarker') {
        var m = L.marker([data.lat, data.lng]).addTo(map).bindPopup(data.name);
        if (data.id) {
          m.on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', id: data.id }));
          });
        }
      }
      if (data.type === 'clearMarkers') {
        map.eachLayer(function(layer) {
          if (layer instanceof L.Marker) map.removeLayer(layer);
        });
      }
    });
    window.addEventListener('message', function(e) {
      document.dispatchEvent(new MessageEvent('message', { data: e.data }));
    });
  </script>
</body>
</html>
`;

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
  savedPoiIds,
  onToggleSave,
  showLayerToggle = false,
  forcedCenter,
  searchMarker,
}: PocketGuideMapProps) {
  const webViewRef = useRef<WebView>(null);

  const {
    routeData,
    isActive,
    activeLegIndex,
    activeStepIndex,
    draftPOIs,
    addToRouteDraft,
    removeFromRouteDraft,
  } = useRoute();

  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [layers, setLayers] = useState({ pins: false, route: true, heatmap: false });
  const [mapReady, setMapReady] = useState(false);

  const postToMap = useCallback((payload: object) => {
    webViewRef.current?.postMessage(JSON.stringify(payload));
  }, []);

  const flyTo = useCallback(
    (lat: number, lng: number) => {
      postToMap({ type: "flyTo", lat, lng });
    },
    [postToMap],
  );

  const syncMarkers = useCallback(() => {
    postToMap({ type: "clearMarkers" });
    if (searchMarker) {
      postToMap({
        type: "addMarker",
        lat: searchMarker.lat,
        lng: searchMarker.lng,
        name: "Arama",
      });
    }
    draftPOIs.forEach((poi, index) => {
      postToMap({
        type: "addMarker",
        lat: poi.coordinate.latitude,
        lng: poi.coordinate.longitude,
        name: `${index + 1}. ${poi.name}`,
        id: poi.id,
      });
    });
  }, [postToMap, searchMarker, draftPOIs]);

  useEffect(() => {
    if (!mapReady) return;
    if (!forcedCenter) return;
    flyTo(forcedCenter.lat, forcedCenter.lng);
  }, [forcedCenter?.lat, forcedCenter?.lng, flyTo, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    syncMarkers();
  }, [syncMarkers, mapReady]);

  useEffect(() => {
    if (!mapReady || !isActive || !routeData) return;
    const step = routeData.legs[activeLegIndex]?.steps[activeStepIndex];
    const idx = step?.way_points?.[0];
    const point = idx != null ? routeData.geometry[idx] : null;
    if (!point) return;
    flyTo(point[0], point[1]);
  }, [activeLegIndex, activeStepIndex, routeData, isActive, flyTo, mapReady]);

  useEffect(() => {
    setLayers((prev) => ({ ...prev, route: isActive }));
  }, [isActive]);

  const mapHtml = useMemo(
    () => buildMapHtml(MAP_INITIAL_LAT, MAP_INITIAL_LNG),
    [],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        onLoadEnd={() => setMapReady(true)}
        onMessage={(event: WebViewMessageEvent) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as {
              type: string;
              lat?: number;
              lng?: number;
              id?: string;
            };
            if (data.type === "markerClick" && data.id) {
              const poi = draftPOIs.find((p) => p.id === data.id);
              if (poi) {
                setSelectedPOI(poi);
                setIsSheetOpen(true);
              }
            }
          } catch {
            /* ignore */
          }
        }}
      />

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
});

export default PocketGuideMap;
